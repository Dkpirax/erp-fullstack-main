import 'dart:html' as html;
void toggleFullScreen() {
  if (html.document.fullscreenElement == null) {
    html.document.documentElement?.requestFullscreen();
  } else {
    html.document.exitFullscreen();
  }
}
