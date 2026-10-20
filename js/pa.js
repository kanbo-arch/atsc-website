// PA ページのヒーロー写真スライダー（Slick・フェード切替）
jQuery(function ($) {
  var $slider = $('#pa-hero-slider');
  if (!$slider.length || !$.fn.slick) return;

  $slider.slick({
    fade: true,
    arrows: false,
    dots: true,
    autoplay: true,
    autoplaySpeed: 4500,
    speed: 1200,
    pauseOnHover: false,
    pauseOnFocus: false,
    infinite: true
  });
});
