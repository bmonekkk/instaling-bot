package com.bmoneczek.instalingbot;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;

/**
 * Classic raised/sunken bevel used by the Android shell so its chrome matches
 * the desktop window, the website and the userscript (gray #c0c0c0 fill, white
 * top/left edge, #404040 bottom/right edge and a 1px black drop shadow).
 */
final class BevelDrawable extends Drawable {

    private static final int LIGHT = Color.WHITE;
    private static final int DARK = 0xFF404040;

    private final Paint paint = new Paint();
    private final int fill;
    private final boolean raised;
    private final int border;

    BevelDrawable(int fill, boolean raised) {
        this(fill, raised, 2);
    }

    BevelDrawable(int fill, boolean raised, int border) {
        this.fill = fill;
        this.raised = raised;
        this.border = Math.max(1, border);
        paint.setStyle(Paint.Style.FILL);
        paint.setAntiAlias(false);
    }

    @Override
    public void draw(Canvas canvas) {
        Rect bounds = getBounds();
        int left = bounds.left;
        int top = bounds.top;
        int right = bounds.right;
        int bottom = bounds.bottom;
        if (right - left <= 0 || bottom - top <= 0) return;

        paint.setColor(fill);
        canvas.drawRect(left, top, right, bottom, paint);

        int topLeft = raised ? LIGHT : DARK;
        int bottomRight = raised ? DARK : LIGHT;

        paint.setColor(topLeft);
        canvas.drawRect(left, top, right, top + border, paint);
        canvas.drawRect(left, top, left + border, bottom, paint);

        paint.setColor(bottomRight);
        canvas.drawRect(left, bottom - border, right, bottom, paint);
        canvas.drawRect(right - border, top, right, bottom, paint);

        if (raised) {
            // 1px black drop shadow along the outer bottom/right edge,
            // mirroring the CSS `box-shadow: 1px 1px 0 #000`.
            paint.setColor(Color.BLACK);
            canvas.drawRect(right - 1, top + border, right, bottom, paint);
            canvas.drawRect(left + border, bottom - 1, right, bottom, paint);
        }
    }

    @Override
    public void setAlpha(int alpha) {
        paint.setAlpha(alpha);
    }

    @Override
    public void setColorFilter(ColorFilter colorFilter) {
        paint.setColorFilter(colorFilter);
    }

    @Override
    public int getOpacity() {
        return PixelFormat.OPAQUE;
    }
}
