// LIVE HOUSE ページの写真スライダー（Slick）
jQuery(function ($) {
  var $slider = $('#lh-slider');
  if (!$slider.length || !$.fn.slick) return;

  $slider.slick({
    dots: true,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 4500,
    speed: 700,
    pauseOnHover: true,
    infinite: true,
    prevArrow: '<button type="button" class="lh-slider__arrow lh-slider__arrow--prev" aria-label="前の写真">&#8249;</button>',
    nextArrow: '<button type="button" class="lh-slider__arrow lh-slider__arrow--next" aria-label="次の写真">&#8250;</button>'
  });
});
