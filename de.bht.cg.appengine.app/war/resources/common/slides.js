(function() {

  var container = $('#slide-container');
  var slideWidth = parseFloat(container.css('width'));
  var slideHeight = parseFloat(container.css('height'));
  var targetRatio = slideWidth / slideHeight;

  var scaleSlideContainer = function(scale, left, top) {
    if (scale) {
      container.css('-webkit-transform', 'scale(' + scale + ')');
      container.css('-moz-transform', 'scale(' + scale + ')');
      container.css('-o-transform', 'scale(' + scale + ')');
      container.css('transform', 'scale(' + scale + ')');
      container.css('top', top);
      container.css('left', left);
    } else {
      container.css('-webkit-transform', '');
      container.css('-moz-transform', '');
      container.css('-o-transform', '');
      container.css('transform', '');
      container.css('top', 0);
      container.css('left', 0);
    }
  };

  $(window).resize(function() {
    var windowWidth = parseFloat($(window).innerWidth());
    var windowHeight = parseFloat($(window).innerHeight());
  
    var aspect = windowWidth / windowHeight;
    var scale = 1.0;
    var left = 0.0;
    var top = 0.0;
    if (aspect >= targetRatio) {
      scale = windowHeight / slideHeight;
      left = (windowWidth - slideWidth * scale) / 2.0; 
    } else {
      scale = windowWidth / slideWidth;
      top = (windowHeight - slideHeight * scale) / 2.0; 
    }

    scaleSlideContainer(scale, left, top);
  });

  var slideCount = $('.slide').length;
  var currentSlide = parseInt(window.location.hash.substring(1)) || 0;

  var showSlide = function(which) {
    $('#slide-' + which + '.slide').css('display', 'inline');
  };

  var hideSlide = function(which) {
    $('#slide-' + which + '.slide').css('display', 'none');
  };

  var showAllSlides = function(which) {
    $('.slide').css('display', 'inline');
  };

  var hideAllSlides = function(which) {
    $('.slide').css('display', 'none');
  };

  var switchToSlide = function(which) {
    hideSlide(currentSlide);
    currentSlide = Math.max(0, Math.min(slideCount - 1, which));
    window.location.hash = currentSlide;
    showSlide(currentSlide);
  };

  var showNextSlide = function() {
    switchToSlide(currentSlide + 1);
  };

  var showPreviousSlide = function() {
    switchToSlide(currentSlide - 1);
  };

  $(window).keydown(function(event) {
    if (event.which == 39)
      showNextSlide();
    else if (event.which == 37)
      showPreviousSlide();
  });

  window.printAllSlides = function() {
    showAllSlides();
    scaleSlideContainer();    
    window.print();
    $(window).resize();
    hideAllSlides();    
    showSlide(currentSlide);
  }

  hideAllSlides();    
  showSlide(currentSlide);

  $('dropdown-toggle').dropdown();
  $(window).resize();
})();

