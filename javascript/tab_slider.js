
var contentArr = [];
contentArr = $.makeArray($('.main-tab-content-row'));
for (var i = 1; i < contentArr.length; i++) {
	contentArr[i].className = 'main-tab-content-row hiddendiv';
};
var currentTab = 0;

$('.main-tab-content').mouseover(function() {
	var ht = $(this).height();
	var wt = $(this).width();
	// $(this).append('<div class="content-title" style="position:absolute;left:10px;top:45%;z-index:20;">&gt;</div')
});

$('.carouselarrow').click(function(){
	// alert("Hi");
	// contentArr[currentTab++].className = 'main-tab-content-row hiddendiv';
	$('#'+contentArr[currentTab++].id).slideToggle("slow", function() {
    	// Animation complete.
  	});
	if (currentTab == contentArr.length) {
		currentTab = 0;
	};
	contentArr[currentTab].className = 'main-tab-content-row';
});
