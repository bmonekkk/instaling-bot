import UIKit
import WebKit
import UserNotifications

final class MainViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {

    private static let startURL = URL(string: "https://instaling.pl/")!
    private static let releasesURL = URL(string: "https://github.com/bmonekkk/instaling-bot/releases/latest")!
    private static let apiURL = URL(string: "https://api.github.com/repos/bmonekkk/instaling-bot/releases/latest")!
    // iOS keeps at most 64 pending local notifications, so a repeating reminder
    // is emulated with a bounded batch of one-shot triggers that the app
    // rebuilds every time it opens, when the settings change and when a
    // session finishes for the day.
    private static let reminderIdentifierPrefix = "instalingbot.daily"
    private static let maxReminderRequests = 60
    private static let reminderIdentifiers: [String] =
        (0..<maxReminderRequests).map { "\(reminderIdentifierPrefix).\($0)" }
    private static let defaultReminderHour = 17
    private static let defaultReminderMinute = 0

    private var webView: WKWebView!
    private var statusLabel: UILabel!
    private var countsLabel: UILabel!
    private var statsLabel: UILabel!
    private var startButton: ClassicButton!
    private var stopButton: ClassicButton!
    private var languageButton: ClassicButton!
    private var reminderButton: ClassicButton!
    private var settingsButton: ClassicButton!
    private var updateButton: ClassicButton!

    private var language = "pl"
    /// A secret shared with the injected engine so only it can drive the bridge.
    private let bridgeToken = UUID().uuidString
    private var pageReady = false
    private var pendingStart = false
    private var lastStatus = "idle"

    private let labels: [String: [String]] = [
        "pl": ["Start", "Stop", "Gotowy", "Uruchamianie...", "Pracuję...", "Zatrzymywanie...",
               "Sesja zakończona", "Błąd", "Zatrzymano", "Aktualizacja",
               "Ustawienia sesji", "Poprawność odpowiedzi (%)", "Powtarzaj przypomnienie (min, 0 = raz dziennie)",
               "Godzina przypomnienia", "Zapisz", "Anuluj", "Zapisano ustawienia",
               "Humanizacja pisania", "Pauza po kliknięciu min (ms)", "Pauza po kliknięciu max (ms)",
               "Opóźnienie liter min (ms)", "Opóźnienie liter max (ms)",
               "Szansa na literówkę (%)", "Szansa na pauzę (%)"],
        "en": ["Start", "Stop", "Ready", "Starting...", "Working...", "Stopping...",
               "Session finished", "Error", "Stopped", "Update",
               "Session settings", "Answer accuracy (%)", "Repeat reminder (min, 0 = once a day)",
               "Reminder time", "Save", "Cancel", "Settings saved",
               "Typing humanization", "Min delay after a click (ms)", "Max delay after a click (ms)",
               "Min letter delay (ms)", "Max letter delay (ms)",
               "Typo chance (%)", "Pause chance (%)"]
    ]

    private func label(_ index: Int) -> String {
        (labels[language] ?? labels["pl"]!)[index]
    }

    private func statusText(_ status: String) -> String {
        switch status {
        case "starting": return label(3)
        case "running": return label(4)
        case "stopping": return label(5)
        case "finished": return label(6)
        case "error": return label(7)
        case "stopped": return label(8)
        default: return label(2)
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        language = UserDefaults.standard.string(forKey: "language") == "en" ? "en" : "pl"
        buildUI()
        configureWebView()
        refreshLanguage()
        refreshReminderButton()
        if UserDefaults.standard.bool(forKey: "reminder") {
            scheduleReminder()
        }
        checkForUpdate()
    }

    // The chrome is a light gray title bar, so keep the status bar text dark
    // even when the device is in dark mode.
    override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
    }

    // MARK: - UI

    private func buildUI() {
        view.backgroundColor = ClassicPalette.window

        // Navy title bar with the wordmark and small beveled controls, matching
        // the desktop window chrome.
        let titleBar = GradientBar(frame: .zero)
        titleBar.translatesAutoresizingMaskIntoConstraints = false

        let title = UILabel()
        title.text = "instaling-bot"
        title.textColor = .white
        title.font = .boldSystemFont(ofSize: 13)
        title.setContentHuggingPriority(.defaultLow, for: .horizontal)
        title.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

        languageButton = makeButton("PL", background: ClassicPalette.window, foreground: .black)
        languageButton.addTarget(self, action: #selector(toggleLanguage), for: .touchUpInside)

        reminderButton = makeButton("⏰", background: ClassicPalette.window, foreground: .black)
        reminderButton.addTarget(self, action: #selector(toggleReminder), for: .touchUpInside)

        settingsButton = makeButton("⚙", background: ClassicPalette.window, foreground: .black)
        settingsButton.accessibilityLabel = label(10)
        settingsButton.addTarget(self, action: #selector(openSettings), for: .touchUpInside)

        let titleRow = UIStackView(arrangedSubviews: [title, languageButton, reminderButton, settingsButton])
        titleRow.axis = .horizontal
        titleRow.alignment = .center
        titleRow.spacing = 4
        titleRow.translatesAutoresizingMaskIntoConstraints = false
        titleBar.addSubview(titleRow)

        NSLayoutConstraint.activate([
            titleRow.leadingAnchor.constraint(equalTo: titleBar.leadingAnchor, constant: 8),
            titleRow.trailingAnchor.constraint(equalTo: titleBar.trailingAnchor, constant: -6),
            titleRow.topAnchor.constraint(equalTo: titleBar.topAnchor, constant: 4),
            titleRow.bottomAnchor.constraint(equalTo: titleBar.bottomAnchor, constant: -4)
        ])

        // Primary actions on the gray body, like the desktop panel.
        startButton = makeButton(label(0), background: ClassicPalette.title1, foreground: .white)
        startButton.addTarget(self, action: #selector(startTapped), for: .touchUpInside)

        stopButton = makeButton(label(1), background: ClassicPalette.red, foreground: .white)
        stopButton.isEnabled = false
        stopButton.addTarget(self, action: #selector(stopTapped), for: .touchUpInside)

        let actionRow = UIStackView(arrangedSubviews: [startButton, stopButton])
        actionRow.axis = .horizontal
        actionRow.spacing = 6
        actionRow.distribution = .fillEqually
        actionRow.isLayoutMarginsRelativeArrangement = true
        actionRow.layoutMargins = UIEdgeInsets(top: 6, left: 8, bottom: 4, right: 8)
        actionRow.backgroundColor = ClassicPalette.window

        let statusBar = UIStackView()
        statusBar.axis = .vertical
        statusBar.spacing = 2
        statusBar.isLayoutMarginsRelativeArrangement = true
        statusBar.layoutMargins = UIEdgeInsets(top: 2, left: 10, bottom: 6, right: 10)
        statusBar.backgroundColor = ClassicPalette.window

        statusLabel = UILabel()
        statusLabel.text = statusText("idle")
        statusLabel.textColor = ClassicPalette.ink
        statusLabel.font = .boldSystemFont(ofSize: 14)

        countsLabel = UILabel()
        countsLabel.text = "0 / 0"
        countsLabel.textColor = ClassicPalette.muted
        countsLabel.font = .systemFont(ofSize: 12)

        statsLabel = UILabel()
        statsLabel.textColor = ClassicPalette.muted
        statsLabel.font = .systemFont(ofSize: 11)
        statsLabel.numberOfLines = 0
        statsLabel.isHidden = true

        updateButton = makeButton(label(9), background: ClassicPalette.title1, foreground: .white)
        updateButton.isHidden = true
        updateButton.addTarget(self, action: #selector(openReleases), for: .touchUpInside)

        statusBar.addArrangedSubview(statusLabel)
        statusBar.addArrangedSubview(countsLabel)
        statusBar.addArrangedSubview(statsLabel)
        statusBar.addArrangedSubview(updateButton)

        webView = WKWebView(frame: .zero, configuration: makeConfiguration())
        webView.navigationDelegate = self
        // Opaque, matching background: no transparent flash or dark navy bleed
        // through the page while it loads.
        webView.isOpaque = true
        webView.backgroundColor = ClassicPalette.window
        webView.scrollView.backgroundColor = ClassicPalette.window
        webView.translatesAutoresizingMaskIntoConstraints = false

        let root = UIStackView(arrangedSubviews: [titleBar, actionRow, statusBar, webView])
        root.axis = .vertical
        root.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(root)

        let guide = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            root.topAnchor.constraint(equalTo: guide.topAnchor),
            root.leadingAnchor.constraint(equalTo: guide.leadingAnchor),
            root.trailingAnchor.constraint(equalTo: guide.trailingAnchor),
            root.bottomAnchor.constraint(equalTo: guide.bottomAnchor)
        ])
    }

    private func makeButton(
        _ text: String,
        background: UIColor,
        foreground: UIColor = .white
    ) -> ClassicButton {
        let button = ClassicButton(title: text, fill: background, foreground: foreground)
        button.setContentHuggingPriority(.required, for: .horizontal)
        return button
    }

    private func makeConfiguration() -> WKWebViewConfiguration {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        // Page scripts must not open windows or drive the app on their own.
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false

        let controller = WKUserContentController()
        controller.add(self, name: "instalingBot")
        controller.addUserScript(makeEngineScript())
        configuration.userContentController = controller

        let dataStore = WKWebsiteDataStore.default()
        configuration.websiteDataStore = dataStore
        return configuration
    }

    private func makeEngineScript() -> WKUserScript {
        let core = loadCoreScript()
        let escapedLanguage = language.replacingOccurrences(of: "'", with: "")
        let boot = """
        (function () {
            if (!window.InstalingBot || window.__instalingBotEngine) { return; }
            var host = location.hostname.toLowerCase();
            if (host !== 'instaling.pl' && host.slice(-13) !== '.instaling.pl') { return; }
            window.__instalingBotEngine = window.InstalingBot.create({
                language: '\(escapedLanguage)',
                config: {
                    valid_chance: \(validChance),
                    delays: {
                        click_min: \(clickMin),
                        click_max: \(clickMax),
                        type_min: \(typeMin),
                        type_max: \(typeMax),
                        type_pause_chance: \(pauseChance),
                        typo_chance: \(typoChance)
                    }
                },
                onEvent: function (event) {
                    try {
                        window.webkit.messageHandlers.instalingBot.postMessage({
                            token: '\(bridgeToken)',
                            event: JSON.stringify(event)
                        });
                    } catch (error) {}
                }
            });
            window.__instalingBotEngine.resume();
        })();
        """
        return WKUserScript(
            source: core + "\n" + boot,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
    }

    private func installEngineScript() {
        let controller = webView.configuration.userContentController
        controller.removeAllUserScripts()
        controller.addUserScript(makeEngineScript())
    }

    private func loadCoreScript() -> String {
        guard let url = Bundle.main.url(forResource: "core", withExtension: "js"),
              let source = try? String(contentsOf: url, encoding: .utf8) else {
            return ""
        }
        return source
    }

    private func configureWebView() {
        webView.load(URLRequest(url: Self.startURL))
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "instalingBot",
              let pageURL = webView.url, Self.isBotURL(pageURL),
              let payload = message.body as? [String: Any],
              let token = payload["token"] as? String, token == bridgeToken,
              let body = payload["event"] as? String,
              let data = body.data(using: .utf8),
              let event = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return }

        DispatchQueue.main.async { [weak self] in
            self?.handle(event: event)
        }
    }

    private func handle(event: [String: Any]) {
        if let state = event["state"] as? [String: Any] {
            let answers = state["answers"] as? Int ?? 0
            let correct = state["correct"] as? Int ?? 0
            let running = state["running"] as? Bool ?? false
            countsLabel.text = "\(answers) / \(correct)"
            startButton.isEnabled = !running
            stopButton.isEnabled = running
        }

        switch event["type"] as? String ?? "" {
        case "status":
            lastStatus = event["status"] as? String ?? "idle"
            statusLabel.text = statusText(lastStatus)
        case "log":
            if let message = event["message"] as? String, !message.isEmpty {
                countsLabel.text = message
            }
        case "error":
            if let message = event["message"] as? String {
                statusLabel.text = "\(label(7)): \(message)"
            }
        case "finished":
            startButton.isEnabled = true
            stopButton.isEnabled = false
            let answers = (event["state"] as? [String: Any])?["answers"] as? Int ?? 0
            let reason = event["reason"] as? String ?? ""
            if answers > 0, reason != "error" {
                // Today's session is done: drop any reminder still queued for
                // today and queue the next days instead.
                UserDefaults.standard.set(Self.dateKey(), forKey: "last_session_date")
                UNUserNotificationCenter.current()
                    .removePendingNotificationRequests(withIdentifiers: Self.reminderIdentifiers)
                if UserDefaults.standard.bool(forKey: "reminder") {
                    scheduleReminder(fromTomorrow: true)
                }
            }
        default:
            break
        }

        let type = event["type"] as? String ?? ""
        if ["answered", "progress", "saved", "finished"].contains(type) {
            refreshStats()
        }
    }

    // MARK: - WKNavigationDelegate

    /// Keeps instaling.pl inside the app and opens everything else in Safari, so a
    /// random page (or an ad) can never talk to the `instalingBot` message handler.
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if Self.isBotURL(url) {
            decisionHandler(.allow)
            return
        }
        if navigationAction.navigationType == .other && navigationAction.targetFrame?.isMainFrame == false {
            // Sub-resources (images, scripts, ads) stay inside the page.
            decisionHandler(.allow)
            return
        }
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == "http" || scheme == "https" {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    private static func isBotURL(_ url: URL) -> Bool {
        guard url.scheme?.lowercased() == "https" else { return false }
        let host = url.host?.lowercased() ?? ""
        return host == "instaling.pl" || host.hasSuffix(".instaling.pl")
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        pageReady = false
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let url = webView.url, Self.isBotURL(url) else {
            pageReady = false
            return
        }
        pageReady = true
        if pendingStart {
            pendingStart = false
            webView.evaluateJavaScript("window.__instalingBotEngine && window.__instalingBotEngine.start()")
        }
        refreshStats()
    }

    // MARK: - Actions

    func requestStart() {
        if pageReady {
            webView.evaluateJavaScript("window.__instalingBotEngine && window.__instalingBotEngine.start()")
        } else {
            pendingStart = true
        }
    }

    func requestStop() {
        pendingStart = false
        webView.evaluateJavaScript("window.__instalingBotEngine && window.__instalingBotEngine.stop()")
    }

    @objc private func startTapped() {
        requestStart()
    }

    @objc private func stopTapped() {
        requestStop()
    }

    @objc private func toggleLanguage() {
        language = language == "pl" ? "en" : "pl"
        UserDefaults.standard.set(language, forKey: "language")
        refreshLanguage()
        if UserDefaults.standard.bool(forKey: "reminder") {
            scheduleReminder()
        }
        webView.evaluateJavaScript("window.__instalingBotEngine && window.__instalingBotEngine.setLanguage('\(language)')")
        installEngineScript()
        refreshStats()
    }

    private func refreshLanguage() {
        languageButton.setTitle(language.uppercased(), for: .normal)
        startButton.setTitle(label(0), for: .normal)
        stopButton.setTitle(label(1), for: .normal)
        updateButton.setTitle(label(9), for: .normal)
        statusLabel.text = statusText(lastStatus)
    }

    @objc private func openReleases() {
        UIApplication.shared.open(Self.releasesURL)
    }

    // MARK: - Settings & statistics

    private var validChance: Double {
        let stored = UserDefaults.standard.object(forKey: "valid_chance") as? Double
        return min(1, max(0, stored ?? 0.8))
    }

    private func intSetting(_ key: String, _ fallback: Int) -> Int {
        UserDefaults.standard.object(forKey: key) == nil
            ? fallback
            : UserDefaults.standard.integer(forKey: key)
    }

    private func doubleSetting(_ key: String, _ fallback: Double) -> Double {
        UserDefaults.standard.object(forKey: key) == nil
            ? fallback
            : UserDefaults.standard.double(forKey: key)
    }

    private var clickMin: Int { max(0, intSetting("click_min", 2000)) }
    private var clickMax: Int { max(0, intSetting("click_max", 4500)) }
    private var typeMin: Int { max(0, intSetting("type_min", 90)) }
    private var typeMax: Int { max(0, intSetting("type_max", 230)) }
    private var typoChance: Double { min(1, max(0, doubleSetting("typo_chance", 0.15))) }
    private var pauseChance: Double { min(1, max(0, doubleSetting("type_pause_chance", 0.12))) }

    private var reminderRepeat: Int {
        max(0, intSetting("reminder_repeat", 0))
    }

    private var reminderHour: Int {
        UserDefaults.standard.object(forKey: "reminder_hour") == nil
            ? Self.defaultReminderHour
            : UserDefaults.standard.integer(forKey: "reminder_hour")
    }

    private var reminderMinute: Int {
        UserDefaults.standard.object(forKey: "reminder_minute") == nil
            ? Self.defaultReminderMinute
            : UserDefaults.standard.integer(forKey: "reminder_minute")
    }

    /// Settings sheet: answer accuracy, the humanization delays shared with the
    /// desktop Advanced section, the reminder time and its repeat interval.
    @objc private func openSettings() {
        let controller = UIViewController()
        controller.view.backgroundColor = ClassicPalette.window
        controller.title = label(10)

        let scroll = UIScrollView()
        scroll.translatesAutoresizingMaskIntoConstraints = false
        controller.view.addSubview(scroll)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(stack)

        let heading = UILabel()
        heading.text = label(10)
        heading.textColor = ClassicPalette.ink
        heading.font = .boldSystemFont(ofSize: 18)
        stack.addArrangedSubview(heading)

        let validityField = makeNumberField(String(Int((validChance * 100).rounded())))
        stack.addArrangedSubview(makeFieldLabel(label(11)))
        stack.addArrangedSubview(validityField)

        stack.addArrangedSubview(makeSectionLabel(label(17)))
        let clickMinField = makeNumberField(String(clickMin))
        stack.addArrangedSubview(makeFieldLabel(label(18)))
        stack.addArrangedSubview(clickMinField)
        let clickMaxField = makeNumberField(String(clickMax))
        stack.addArrangedSubview(makeFieldLabel(label(19)))
        stack.addArrangedSubview(clickMaxField)
        let typeMinField = makeNumberField(String(typeMin))
        stack.addArrangedSubview(makeFieldLabel(label(20)))
        stack.addArrangedSubview(typeMinField)
        let typeMaxField = makeNumberField(String(typeMax))
        stack.addArrangedSubview(makeFieldLabel(label(21)))
        stack.addArrangedSubview(typeMaxField)
        let typoField = makeNumberField(String(Int((typoChance * 100).rounded())))
        stack.addArrangedSubview(makeFieldLabel(label(22)))
        stack.addArrangedSubview(typoField)
        let pauseField = makeNumberField(String(Int((pauseChance * 100).rounded())))
        stack.addArrangedSubview(makeFieldLabel(label(23)))
        stack.addArrangedSubview(pauseField)

        let timePicker = UIDatePicker()
        timePicker.datePickerMode = .time
        timePicker.preferredDatePickerStyle = .compact
        timePicker.tintColor = ClassicPalette.title1
        var components = DateComponents()
        components.hour = reminderHour
        components.minute = reminderMinute
        if let date = Calendar.current.date(from: components) {
            timePicker.date = date
        }
        stack.addArrangedSubview(makeFieldLabel(label(13)))
        stack.addArrangedSubview(timePicker)

        let repeatField = makeNumberField(String(reminderRepeat))
        stack.addArrangedSubview(makeFieldLabel(label(12)))
        stack.addArrangedSubview(repeatField)

        let buttons = UIStackView()
        buttons.axis = .horizontal
        buttons.spacing = 10
        buttons.distribution = .fillEqually

        let cancel = ClassicButton(title: label(15), fill: ClassicPalette.window, foreground: .black)
        cancel.heightAnchor.constraint(equalToConstant: 44).isActive = true
        cancel.addAction(UIAction { _ in controller.dismiss(animated: true) }, for: .touchUpInside)

        let save = ClassicButton(title: label(14), fill: ClassicPalette.title1, foreground: .white)
        save.heightAnchor.constraint(equalToConstant: 44).isActive = true
        save.addAction(UIAction { [weak self] _ in
            guard let self else { return }
            let percent = min(100, max(0, Int(validityField.text ?? "") ?? 80))
            let clickMinValue = min(120000, max(0, Int(clickMinField.text ?? "") ?? 2000))
            let clickMaxValue = max(clickMinValue, min(120000, max(0, Int(clickMaxField.text ?? "") ?? 4500)))
            let typeMinValue = min(5000, max(0, Int(typeMinField.text ?? "") ?? 90))
            let typeMaxValue = max(typeMinValue, min(5000, max(0, Int(typeMaxField.text ?? "") ?? 230)))
            let typoValue = min(100, max(0, Int(typoField.text ?? "") ?? 15))
            let pauseValue = min(100, max(0, Int(pauseField.text ?? "") ?? 12))
            let repeatValue = min(1440, max(0, Int(repeatField.text ?? "") ?? 0))
            let time = Calendar.current.dateComponents([.hour, .minute], from: timePicker.date)
            UserDefaults.standard.set(Double(percent) / 100, forKey: "valid_chance")
            UserDefaults.standard.set(clickMinValue, forKey: "click_min")
            UserDefaults.standard.set(clickMaxValue, forKey: "click_max")
            UserDefaults.standard.set(typeMinValue, forKey: "type_min")
            UserDefaults.standard.set(typeMaxValue, forKey: "type_max")
            UserDefaults.standard.set(Double(typoValue) / 100, forKey: "typo_chance")
            UserDefaults.standard.set(Double(pauseValue) / 100, forKey: "type_pause_chance")
            UserDefaults.standard.set(time.hour ?? Self.defaultReminderHour, forKey: "reminder_hour")
            UserDefaults.standard.set(time.minute ?? Self.defaultReminderMinute, forKey: "reminder_minute")
            UserDefaults.standard.set(repeatValue, forKey: "reminder_repeat")
            self.applyConfigToEngine()
            if UserDefaults.standard.bool(forKey: "reminder") {
                self.scheduleReminder()
            }
            controller.dismiss(animated: true)
            self.refreshStats()
        }, for: .touchUpInside)

        buttons.addArrangedSubview(cancel)
        buttons.addArrangedSubview(save)
        stack.addArrangedSubview(buttons)

        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.topAnchor),
            scroll.leadingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.bottomAnchor),
            stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor, constant: -20),
            stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -24),
            stack.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor, constant: -40)
        ])

        present(controller, animated: true)
    }

    private func makeNumberField(_ value: String) -> UITextField {
        let field = UITextField()
        field.text = value
        field.keyboardType = .numberPad
        field.textColor = ClassicPalette.ink
        field.font = .systemFont(ofSize: 15)
        field.backgroundColor = .white
        field.layer.cornerRadius = 0
        field.layer.borderWidth = 2
        field.layer.borderColor = ClassicPalette.windowDarker.cgColor
        field.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 10, height: 1))
        field.leftViewMode = .always
        field.heightAnchor.constraint(equalToConstant: 44).isActive = true
        return field
    }

    private func makeFieldLabel(_ text: String) -> UILabel {
        let view = UILabel()
        view.text = text
        view.textColor = ClassicPalette.ink
        view.font = .boldSystemFont(ofSize: 13)
        return view
    }

    private func makeSectionLabel(_ text: String) -> UILabel {
        let view = UILabel()
        view.text = text
        view.textColor = ClassicPalette.title1
        view.font = .boldSystemFont(ofSize: 15)
        return view
    }

    private func applyConfigToEngine() {
        let script = "window.__instalingBotEngine && window.__instalingBotEngine.setConfig({"
            + "valid_chance:\(validChance),"
            + "delays:{click_min:\(clickMin),click_max:\(clickMax),"
            + "type_min:\(typeMin),type_max:\(typeMax),"
            + "type_pause_chance:\(pauseChance),typo_chance:\(typoChance)}})"
        webView?.evaluateJavaScript(script)
    }

    /// Reads the engine statistics so the mobile shells show the same
    /// today/accuracy/streak summary as the desktop app.
    private func refreshStats() {
        webView?.evaluateJavaScript(
            "(function(){try{return window.__instalingBotEngine?"
                + "window.__instalingBotEngine.getStats():null;}catch(e){return null;}})()"
        ) { [weak self] result, _ in
            guard let self, let stats = result as? [String: Any] else { return }
            let today = stats["today"] as? [String: Any] ?? [:]
            let total = stats["total"] as? [String: Any] ?? [:]
            let answered = today["answers"] as? Int ?? 0
            let correct = today["correct"] as? Int ?? 0
            let percent = total["accuracy"] as? Int ?? 0
            let streak = stats["streak"] as? Int ?? 0
            let english = self.language == "en"
            var line = english
                ? "Today: \(answered) answers, \(correct) correct · Accuracy: \(percent)%"
                : "Dziś: \(answered) odpowiedzi, \(correct) poprawnych · Skuteczność: \(percent)%"
            if streak > 1 {
                line += english ? " · Streak: \(streak) days" : " · Seria: \(streak) dni"
            }
            self.statsLabel.text = line
            self.statsLabel.isHidden = false
        }
    }

    // MARK: - Reminders

    @objc private func toggleReminder() {
        let enabled = !UserDefaults.standard.bool(forKey: "reminder")
        UserDefaults.standard.set(enabled, forKey: "reminder")
        if enabled {
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                DispatchQueue.main.async { [weak self] in
                    guard let self else { return }
                    if granted {
                        self.scheduleReminder()
                    } else {
                        UserDefaults.standard.set(false, forKey: "reminder")
                    }
                    self.refreshReminderButton()
                }
            }
        } else {
            UNUserNotificationCenter.current().removePendingNotificationRequests(
                withIdentifiers: Self.reminderIdentifiers
            )
        }
        refreshReminderButton()
    }

    /// Queues the reminder notifications. With `repeat_minutes` at 0 it fires
    /// once a day; otherwise it repeats every N minutes. Either way the batch
    /// stops mattering as soon as a session finishes today, because finishing a
    /// session clears the queue and reschedules from tomorrow.
    private func scheduleReminder(fromTomorrow: Bool = false) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: Self.reminderIdentifiers)
        guard UserDefaults.standard.bool(forKey: "reminder") else { return }
        if !fromTomorrow,
           UserDefaults.standard.string(forKey: "last_session_date") == Self.dateKey() {
            return
        }

        let english = language == "en"
        let content = UNMutableNotificationContent()
        content.title = english ? "Time for today's InstaLing session" : "Czas na dzisiejszą sesję na InstaLing"
        content.body = english
            ? "Open instaling-bot and start a session. You can turn this reminder off in the app."
            : "Otwórz instaling-bot i rozpocznij sesję. Przypomnienie wyłączysz w aplikacji."
        content.sound = .default

        let calendar = Calendar.current
        var fireDate = calendar.date(
            bySettingHour: reminderHour, minute: reminderMinute, second: 0, of: Date()
        ) ?? Date()
        if fromTomorrow || fireDate <= Date() {
            fireDate = calendar.date(byAdding: .day, value: 1, to: fireDate) ?? fireDate
        }

        let repeatMinutes = reminderRepeat
        let step = repeatMinutes > 0 ? repeatMinutes * 60 : 24 * 60 * 60

        for index in 0..<Self.maxReminderRequests {
            let components = calendar.dateComponents(
                [.year, .month, .day, .hour, .minute], from: fireDate
            )
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(
                identifier: "\(Self.reminderIdentifierPrefix).\(index)",
                content: content,
                trigger: trigger
            )
            center.add(request, withCompletionHandler: nil)
            fireDate = calendar.date(byAdding: .second, value: step, to: fireDate) ?? fireDate
        }
    }

    private static func dateKey(_ date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    private func refreshReminderButton() {
        let enabled = UserDefaults.standard.bool(forKey: "reminder")
        reminderButton.fillColor = enabled ? ClassicPalette.green : ClassicPalette.window
        reminderButton.setTitleColor(enabled ? .white : .black, for: .normal)
    }

    // MARK: - Updates

    private func checkForUpdate() {
        var request = URLRequest(url: Self.apiURL)
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.setValue("instaling-bot-mobile", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 8

        URLSession.shared.dataTask(with: request) { [weak self] data, response, _ in
            guard let data,
                  let http = response as? HTTPURLResponse,
                  http.statusCode == 200,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let tag = json["tag_name"] as? String
            else { return }

            let current = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "4.2.0"
            guard Self.isNewer(tag, than: current) else { return }

            DispatchQueue.main.async {
                self?.updateButton.isHidden = false
                self?.updateButton.setTitle("\(self?.label(9) ?? "Update") \(tag)", for: .normal)
            }
        }.resume()
    }

    private static func isNewer(_ remoteTag: String, than current: String) -> Bool {
        let remote = remoteTag.replacingOccurrences(of: "^v", with: "", options: .regularExpression)
            .split(whereSeparator: { $0 == "." || $0 == "-" })
            .compactMap { Int($0) }
        let local = current.split(whereSeparator: { $0 == "." || $0 == "-" }).compactMap { Int($0) }
        for index in 0..<min(remote.count, local.count) where remote[index] != local[index] {
            return remote[index] > local[index]
        }
        return remote.count > local.count
    }
}
