import UIKit

/// Classic palette shared with the desktop window, the website and the userscript.
enum ClassicPalette {
    static let window = UIColor(red: 0.753, green: 0.753, blue: 0.753, alpha: 1)        // #c0c0c0
    static let windowLight = UIColor(red: 0.875, green: 0.875, blue: 0.875, alpha: 1)   // #dfdfdf
    static let windowDark = UIColor(red: 0.502, green: 0.502, blue: 0.502, alpha: 1)    // #808080
    static let windowDarker = UIColor(red: 0.251, green: 0.251, blue: 0.251, alpha: 1)  // #404040
    static let title1 = UIColor(red: 0, green: 0, blue: 0.502, alpha: 1)                // #000080
    static let title2 = UIColor(red: 0.063, green: 0.518, blue: 0.816, alpha: 1)        // #1084d0
    static let ink = UIColor.black
    static let muted = UIColor(red: 0.29, green: 0.29, blue: 0.29, alpha: 1)            // #4a4a4a
    static let green = UIColor(red: 0, green: 0.392, blue: 0, alpha: 1)                 // #006400
    static let red = UIColor(red: 0.502, green: 0, blue: 0, alpha: 1)                   // #800000
    static let yellow = UIColor(red: 1, green: 1, blue: 0.8, alpha: 1)                  // #ffffcc
}

/// Square beveled surface: white top/left edge, #404040 bottom/right edge, gray fill.
final class BevelView: UIView {

    var fillColor: UIColor = ClassicPalette.window {
        didSet { setNeedsDisplay() }
    }
    /// Raised (default) or sunken, used for the pressed state.
    var raised: Bool = true {
        didSet { setNeedsDisplay() }
    }

    private let border: CGFloat = 2

    override init(frame: CGRect) {
        super.init(frame: frame)
        isOpaque = true
        backgroundColor = .clear
        contentMode = .redraw
        isUserInteractionEnabled = false
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }
        let topLeft = raised ? UIColor.white : ClassicPalette.windowDarker
        let bottomRight = raised ? ClassicPalette.windowDarker : UIColor.white

        context.setFillColor(fillColor.cgColor)
        context.fill(rect)

        context.setFillColor(topLeft.cgColor)
        context.fill(CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: border))
        context.fill(CGRect(x: rect.minX, y: rect.minY, width: border, height: rect.height))

        context.setFillColor(bottomRight.cgColor)
        context.fill(CGRect(x: rect.minX, y: rect.maxY - border, width: rect.width, height: border))
        context.fill(CGRect(x: rect.maxX - border, y: rect.minY, width: border, height: rect.height))
    }
}

/// UIButton that paints a classic bevel behind its title and sinks when pressed.
final class ClassicButton: UIButton {

    private let bevel = BevelView(frame: .zero)
    private var baseFill: UIColor

    init(title: String, fill: UIColor, foreground: UIColor) {
        baseFill = fill
        super.init(frame: .zero)
        bevel.fillColor = fill
        bevel.translatesAutoresizingMaskIntoConstraints = false
        insertSubview(bevel, at: 0)
        NSLayoutConstraint.activate([
            bevel.leadingAnchor.constraint(equalTo: leadingAnchor),
            bevel.trailingAnchor.constraint(equalTo: trailingAnchor),
            bevel.topAnchor.constraint(equalTo: topAnchor),
            bevel.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])

        setTitle(title, for: .normal)
        setTitleColor(foreground, for: .normal)
        setTitleColor(ClassicPalette.windowDark, for: .disabled)
        titleLabel?.font = .boldSystemFont(ofSize: 13)
        titleLabel?.adjustsFontSizeToFitWidth = true
        titleLabel?.minimumScaleFactor = 0.7
        contentEdgeInsets = UIEdgeInsets(top: 8, left: 10, bottom: 8, right: 10)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    /// Updates the fill, keeping the gray disabled look when inactive.
    var fillColor: UIColor {
        get { baseFill }
        set {
            baseFill = newValue
            bevel.fillColor = isEnabled ? newValue : ClassicPalette.window
        }
    }

    override var isEnabled: Bool {
        didSet { bevel.fillColor = isEnabled ? baseFill : ClassicPalette.window }
    }

    override var isHighlighted: Bool {
        didSet { bevel.raised = !isHighlighted }
    }
}

/// Navy title bar with the classic left-to-right gradient.
final class GradientBar: UIView {

    private let gradient = CAGradientLayer()

    override init(frame: CGRect) {
        super.init(frame: frame)
        gradient.colors = [ClassicPalette.title1.cgColor, ClassicPalette.title2.cgColor]
        gradient.startPoint = CGPoint(x: 0, y: 0.5)
        gradient.endPoint = CGPoint(x: 1, y: 0.5)
        layer.insertSublayer(gradient, at: 0)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        gradient.frame = bounds
    }
}
