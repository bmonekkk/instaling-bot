import UIKit
import WebKit
import UserNotifications

final class MainViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {

    private static let startURL = URL(string: "https://instaling.pl/")!
    private static let releasesURL = URL(string: "https://github.com/bmonekkk/instaling-bot/releases/latest")!
    private static let apiURL = URL(string: "https://api.github.com/repos/bmonekkk/instaling-bot/releases/latest")!
    private static let reminderIdentifier = "instalingbot.daily"
    private static let reminderHour = 17

    private var webView: WKWebView!
    private var statusLabel: UILabel!
    private var countsLabel: UILabel!
    private var startButton: UIButton!
    private var stopButton: UIButton!
    private var languageButton: UIButton!
    private var reminderButton: UIButton!
    private var updateButton: UIButton!

    private var language = "pl"
    private var pageReady = false
    private var pendingStart = false
    private var lastStatus = "idle"

    private let labels: [String: [String]] = [
        "pl": ["Start", "Stop", "Gotowy", "Uruchamianie…", "Pracuję…", "Zatrzymywanie…",
               "Sesja zakończona", "Błąd", "Zatrzymano", "Aktualizacja"],
        "en": ["Start", "Stop", "Ready", "Starting…", "Working…", "Stopping…",
               "Session finished", "Error", "Stopped", "Update"]
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
        language = UserDefaults.standard.string(forKey: "language") ?? "pl"
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

        updateButton = makeButton(label(9), background: UIColor(red: 0.114, green: 0.306, blue: 0.847, alpha: 1))
        updateButton.isHidden = true
        updateButton.addTarget(self, action: #selector(openReleases), for: .touchUpInside)
        statusBar.addArrangedSubview(updateButton)

        webView = WKWebView(frame: .zero, configuration: makeConfiguration())
        webView.navigationDelegate = self
        webView.isOpaque = false
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
            window.__instalingBotEngine = window.InstalingBot.create({
                language: '\(escapedLanguage)',
                onEvent: function (event) {
                    try {
                        window.webkit.messageHandlers.instalingBot.postMessage(JSON.stringify(event));
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
              let body = message.body as? String,
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
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        pageReady = false
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageReady = true
        if pendingStart {
            pendingStart = false
            webView.evaluateJavaScript("window.__instalingBotEngine && window.__instalingBotEngine.start()")
        }
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
        components.hour = Self.reminderHour
        components.minute = 0

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

            let current = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "4.0.0"
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
