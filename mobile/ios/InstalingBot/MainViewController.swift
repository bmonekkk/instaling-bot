import UIKit
import WebKit
import UserNotifications

final class MainViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {

    private static let startURL = URL(string: "https://instaling.pl/")!
    private static let releasesURL = URL(string: "https://github.com/bmonekkk/instaling-bot/releases/latest")!
    private static let apiURL = URL(string: "https://api.github.com/repos/bmonekkk/instaling-bot/releases/latest")!
    private static let reminderIdentifier = "instalingbot.daily"
    private static let defaultReminderHour = 17
    private static let defaultReminderMinute = 0

    private var webView: WKWebView!
    private var statusLabel: UILabel!
    private var countsLabel: UILabel!
    private var statsLabel: UILabel!
    private var startButton: UIButton!
    private var stopButton: UIButton!
    private var languageButton: UIButton!
    private var reminderButton: UIButton!
    private var settingsButton: UIButton!
    private var updateButton: UIButton!

    private var language = "pl"
    /// A secret shared with the injected engine so only it can drive the bridge.
    private let bridgeToken = UUID().uuidString
    private var pageReady = false
    private var pendingStart = false
    private var lastStatus = "idle"

    private let labels: [String: [String]] = [
        "pl": ["Start", "Stop", "Gotowy", "Uruchamianie…", "Pracuję…", "Zatrzymywanie…",
               "Sesja zakończona", "Błąd", "Zatrzymano", "Aktualizacja",
               "Ustawienia sesji", "Poprawność odpowiedzi (%)", "Limit odpowiedzi (0 = brak limitu)",
               "Godzina przypomnienia", "Zapisz", "Anuluj", "Zapisano ustawienia"],
        "en": ["Start", "Stop", "Ready", "Starting…", "Working…", "Stopping…",
               "Session finished", "Error", "Stopped", "Update",
               "Session settings", "Answer accuracy (%)", "Answer limit (0 = no limit)",
               "Reminder time", "Save", "Cancel", "Settings saved"]
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

    // MARK: - UI

    private func buildUI() {
        view.backgroundColor = UIColor(red: 0.067, green: 0.094, blue: 0.153, alpha: 1)

        let toolbar = UIStackView()
        toolbar.axis = .horizontal
        toolbar.alignment = .center
        toolbar.spacing = 6
        toolbar.backgroundColor = UIColor(red: 0.122, green: 0.161, blue: 0.216, alpha: 1)
        toolbar.isLayoutMarginsRelativeArrangement = true
        toolbar.layoutMargins = UIEdgeInsets(top: 8, left: 10, bottom: 8, right: 10)
        toolbar.distribution = .fillEqually

        let title = UILabel()
        title.text = "instaling-bot"
        title.textColor = UIColor(red: 0.42, green: 0.45, blue: 0.5, alpha: 1)
        title.font = .boldSystemFont(ofSize: 11)
        title.setContentHuggingPriority(.required, for: .horizontal)
        title.setContentCompressionResistancePriority(.required, for: .horizontal)

        languageButton = makeButton("PL", background: UIColor(red: 0.216, green: 0.255, blue: 0.318, alpha: 1))
        languageButton.addTarget(self, action: #selector(toggleLanguage), for: .touchUpInside)
        toolbar.addArrangedSubview(languageButton)

        reminderButton = makeButton("⏰", background: UIColor(red: 0.216, green: 0.255, blue: 0.318, alpha: 1))
        reminderButton.addTarget(self, action: #selector(toggleReminder), for: .touchUpInside)
        toolbar.addArrangedSubview(reminderButton)

        settingsButton = makeButton("⚙", background: UIColor(red: 0.216, green: 0.255, blue: 0.318, alpha: 1))
        settingsButton.accessibilityLabel = label(10)
        settingsButton.addTarget(self, action: #selector(openSettings), for: .touchUpInside)
        toolbar.addArrangedSubview(settingsButton)

        startButton = makeButton(label(0), background: UIColor(red: 0.133, green: 0.773, blue: 0.369, alpha: 1), foreground: .black)
        startButton.addTarget(self, action: #selector(startTapped), for: .touchUpInside)
        toolbar.addArrangedSubview(startButton)

        stopButton = makeButton(label(1), background: UIColor(red: 0.937, green: 0.267, blue: 0.267, alpha: 1))
        stopButton.isEnabled = false
        stopButton.addTarget(self, action: #selector(stopTapped), for: .touchUpInside)
        toolbar.addArrangedSubview(stopButton)

        let statusBar = UIStackView()
        statusBar.axis = .vertical
        statusBar.spacing = 2
        statusBar.isLayoutMarginsRelativeArrangement = true
        statusBar.layoutMargins = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 12)
        // Opaque status surface: no transparency that could make text unreadable
        // over the dark navy window during load.
        statusBar.backgroundColor = view.backgroundColor

        statusLabel = UILabel()
        statusLabel.text = statusText("idle")
        statusLabel.textColor = UIColor(red: 0.576, green: 0.773, blue: 0.992, alpha: 1)
        statusLabel.font = .boldSystemFont(ofSize: 14)

        let statusRow = UIStackView(arrangedSubviews: [title, statusLabel])
        statusRow.axis = .horizontal
        statusRow.alignment = .center
        statusRow.spacing = 8
        statusBar.addArrangedSubview(statusRow)

        countsLabel = UILabel()
        countsLabel.text = "0 / 0"
        countsLabel.textColor = UIColor(red: 0.82, green: 0.835, blue: 0.859, alpha: 1)
        countsLabel.font = .systemFont(ofSize: 12)
        statusBar.addArrangedSubview(countsLabel)

        statsLabel = UILabel()
        statsLabel.textColor = UIColor(red: 0.61, green: 0.639, blue: 0.686, alpha: 1)
        statsLabel.font = .systemFont(ofSize: 11)
        statsLabel.numberOfLines = 0
        statsLabel.isHidden = true
        statusBar.addArrangedSubview(statsLabel)

        updateButton = makeButton(label(9), background: UIColor(red: 0.114, green: 0.306, blue: 0.847, alpha: 1))
        updateButton.isHidden = true
        updateButton.addTarget(self, action: #selector(openReleases), for: .touchUpInside)
        statusBar.addArrangedSubview(updateButton)

        webView = WKWebView(frame: .zero, configuration: makeConfiguration())
        webView.navigationDelegate = self
        // Opaque, matching background: no transparent flash or dark navy bleed
        // through the page while it loads.
        webView.isOpaque = true
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.translatesAutoresizingMaskIntoConstraints = false

        let root = UIStackView(arrangedSubviews: [toolbar, statusBar, webView])
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
    ) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(text, for: .normal)
        button.setTitleColor(foreground, for: .normal)
        button.titleLabel?.font = .boldSystemFont(ofSize: 13)
        button.backgroundColor = background
        button.layer.cornerRadius = 8
        button.contentEdgeInsets = UIEdgeInsets(top: 8, left: 10, bottom: 8, right: 10)
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
                config: { valid_chance: \(validChance), max_answers: \(maxAnswers) },
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

    private var maxAnswers: Int {
        max(0, UserDefaults.standard.integer(forKey: "max_answers"))
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

    /// Settings sheet: answer accuracy, answer limit and reminder time, the
    /// same three options the Android shell and the userscript expose.
    @objc private func openSettings() {
        let controller = UIViewController()
        controller.view.backgroundColor = UIColor(red: 0.067, green: 0.094, blue: 0.153, alpha: 1)
        controller.title = label(10)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 10
        stack.translatesAutoresizingMaskIntoConstraints = false
        controller.view.addSubview(stack)

        let heading = UILabel()
        heading.text = label(10)
        heading.textColor = .white
        heading.font = .boldSystemFont(ofSize: 18)
        stack.addArrangedSubview(heading)

        let validityField = makeNumberField(String(Int((validChance * 100).rounded())))
        stack.addArrangedSubview(makeFieldLabel(label(11)))
        stack.addArrangedSubview(validityField)

        let limitField = makeNumberField(String(maxAnswers))
        stack.addArrangedSubview(makeFieldLabel(label(12)))
        stack.addArrangedSubview(limitField)

        let timePicker = UIDatePicker()
        timePicker.datePickerMode = .time
        timePicker.preferredDatePickerStyle = .compact
        var components = DateComponents()
        components.hour = reminderHour
        components.minute = reminderMinute
        if let date = Calendar.current.date(from: components) {
            timePicker.date = date
        }
        stack.addArrangedSubview(makeFieldLabel(label(13)))
        stack.addArrangedSubview(timePicker)

        let buttons = UIStackView()
        buttons.axis = .horizontal
        buttons.spacing = 10
        buttons.distribution = .fillEqually

        let cancel = UIButton(type: .system)
        cancel.setTitle(label(15), for: .normal)
        cancel.setTitleColor(.white, for: .normal)
        cancel.backgroundColor = UIColor(red: 0.216, green: 0.255, blue: 0.318, alpha: 1)
        cancel.layer.cornerRadius = 8
        cancel.heightAnchor.constraint(equalToConstant: 44).isActive = true
        cancel.addAction(UIAction { _ in controller.dismiss(animated: true) }, for: .touchUpInside)

        let save = UIButton(type: .system)
        save.setTitle(label(14), for: .normal)
        save.setTitleColor(.white, for: .normal)
        save.backgroundColor = UIColor(red: 0.114, green: 0.306, blue: 0.847, alpha: 1)
        save.layer.cornerRadius = 8
        save.heightAnchor.constraint(equalToConstant: 44).isActive = true
        save.addAction(UIAction { [weak self] _ in
            guard let self else { return }
            let percent = min(100, max(0, Int(validityField.text ?? "") ?? 80))
            let limit = max(0, Int(limitField.text ?? "") ?? 0)
            let time = Calendar.current.dateComponents([.hour, .minute], from: timePicker.date)
            UserDefaults.standard.set(Double(percent) / 100, forKey: "valid_chance")
            UserDefaults.standard.set(limit, forKey: "max_answers")
            UserDefaults.standard.set(time.hour ?? Self.defaultReminderHour, forKey: "reminder_hour")
            UserDefaults.standard.set(time.minute ?? Self.defaultReminderMinute, forKey: "reminder_minute")
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
            stack.topAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.topAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.trailingAnchor, constant: -20)
        ])

        present(controller, animated: true)
    }

    private func makeNumberField(_ value: String) -> UITextField {
        let field = UITextField()
        field.text = value
        field.keyboardType = .numberPad
        field.textColor = .white
        field.backgroundColor = UIColor(red: 0.122, green: 0.161, blue: 0.216, alpha: 1)
        field.layer.cornerRadius = 8
        field.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 10, height: 1))
        field.leftViewMode = .always
        field.heightAnchor.constraint(equalToConstant: 44).isActive = true
        return field
    }

    private func makeFieldLabel(_ text: String) -> UILabel {
        let view = UILabel()
        view.text = text
        view.textColor = UIColor(red: 0.82, green: 0.835, blue: 0.859, alpha: 1)
        view.font = .systemFont(ofSize: 13)
        return view
    }

    private func applyConfigToEngine() {
        let script = "window.__instalingBotEngine && window.__instalingBotEngine.setConfig({"
            + "valid_chance:\(validChance),max_answers:\(maxAnswers)})"
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
                withIdentifiers: [Self.reminderIdentifier]
            )
        }
        refreshReminderButton()
    }

    private func scheduleReminder() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [Self.reminderIdentifier])
        guard UserDefaults.standard.bool(forKey: "reminder") else { return }

        var components = DateComponents()
        components.hour = reminderHour
        components.minute = reminderMinute

        let english = language == "en"
        let content = UNMutableNotificationContent()
        content.title = english ? "Time for today's InstaLing session" : "Czas na dzisiejszą sesję na InstaLing"
        content.body = english
            ? "Open instaling-bot and start a session. You can turn this reminder off in the app."
            : "Otwórz instaling-bot i rozpocznij sesję. Przypomnienie wyłączysz w aplikacji."
        content.sound = .default

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(
            identifier: Self.reminderIdentifier,
            content: content,
            trigger: trigger
        )
        center.add(request, withCompletionHandler: nil)
    }

    private func refreshReminderButton() {
        let enabled = UserDefaults.standard.bool(forKey: "reminder")
        reminderButton.backgroundColor = enabled
            ? UIColor(red: 0.059, green: 0.463, blue: 0.431, alpha: 1)
            : UIColor(red: 0.216, green: 0.255, blue: 0.318, alpha: 1)
        reminderButton.alpha = enabled ? 1 : 0.7
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

            let current = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "4.1.0"
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
