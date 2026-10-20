// MANAGEMENT ページ：アーティスト写真スライダー（Slick）
jQuery(function ($) {
  var $slider = $('#artist-slider');
  if (!$slider.length || !$.fn.slick) return;

  $slider.slick({
    dots: true,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 4000,
    speed: 700,
    fade: true,
    pauseOnHover: true,
    infinite: true,
    prevArrow: '<button type="button" class="lh-slider__arrow lh-slider__arrow--prev" aria-label="前の写真">&#8249;</button>',
    nextArrow: '<button type="button" class="lh-slider__arrow lh-slider__arrow--next" aria-label="次の写真">&#8250;</button>'
  });
});
