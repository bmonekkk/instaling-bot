import UIKit

/// iOS 26+ requires apps built with the current SDK to adopt the UIScene
/// lifecycle. Without it UIKit raises a runtime issue at launch and the app
/// traps before the first frame is drawn.
final class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let controller = MainViewController()
        AppDelegate.shared?.attach(controller: controller)

        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        self.window = window
        AppDelegate.shared?.window = window

        if let url = connectionOptions.urlContexts.first?.url {
            AppDelegate.shared?.handle(url: url)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        AppDelegate.shared?.handle(url: url)
    }
}
