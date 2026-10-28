import UIKit
import UserNotifications

@main
final class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    static private(set) var shared: AppDelegate?

    var window: UIWindow?
    private(set) var controller: MainViewController?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        AppDelegate.shared = self
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func attach(controller: MainViewController) {
        self.controller = controller
    }

    func handle(url: URL) {
        guard url.scheme?.lowercased() == "instalingbot" else { return }
        switch url.host?.lowercased() {
        case "start":
            controller?.requestStart()
        case "stop":
            controller?.requestStop()
        default:
            break
        }
    }

    // Show reminders even while the app is in the foreground.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }
}
