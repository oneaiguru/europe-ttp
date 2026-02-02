// [START] SMOOTH SHOW-HIDE ----------------------------------------------------------------------

// Show an element
var show_menu_section = function (elem) {

  elem.style.display = 'table-row-group';

  // // Get the natural height of the element
  // var getHeight = function () {
  //   elem.style.display = 'block'; // Make it visible
  //   var height = elem.scrollHeight + 'px'; // Get it's height
  //   elem.style.display = ''; //  Hide it again
  //   return height;
  // };

  // var height = getHeight(); // Get the natural height
  // elem.classList.add('is-visible'); // Make the element visible
  // elem.style.height = height; // Update the max-height

  // // Once the transition is complete, remove the inline max-height so the content can scale responsively
  // window.setTimeout(function () {
  //   elem.style.height = '';
  // }, 350);

};

// Hide an element
var hide_menu_section = function (elem) {

  elem.style.display = 'none';

  // // Give the element a height to change from
  // elem.style.height = elem.scrollHeight + 'px';

  // // Set the height back to 0
  // window.setTimeout(function () {
  //   elem.style.height = '0';
  // }, 1);

  // // When the transition is complete, hide it
  // window.setTimeout(function () {
  //   elem.classList.remove('is-visible');
  // }, 350);

};

// Toggle element visibility
// var toggle_menu_section = function (menu_header) {

//     var current_status = menu_header.getAttribute('menu-status');
//     var _e = document.getElementsByName(menu_header.id);
//     for (let j = 0; j < _e.length; j++) {
//         var e = _e[j];
//         if (current_status == 'expanded') {
//             hide(e);
//         } else {
//             show(e);
//         }
//     }
//     if (current_status == 'expanded') {
//         menu_header.setAttribute('menu-status', 'collapsed');
//     } else {
//         menu_header.setAttribute('menu-status', 'expanded');
//     }

// };

// 
var initiate_menu_items = function () {
    var _section_headers = document.getElementsByClassName('section-header');

    for (let i = 0; i < _section_headers.length; i++) {
        const element = _section_headers[i];
        element.onclick = function () {
            var current_status = this.getAttribute('menu-status');
            var _e = document.getElementsByName(this.id);
            for (let j = 0; j < _e.length; j++) {
                var e = _e[j];
                if (current_status == 'expanded') {
                    hide_menu_section(e);
                } else {
                    show_menu_section(e);
                }
            }
            if (current_status == 'expanded') {
                this.setAttribute('menu-status', 'collapsed');
            } else {
                this.setAttribute('menu-status', 'expanded');
            }
        }

    }

    // $('.section-header').click(function() {
    //   var current_status = $(this).attr('menu-status');
    //   // var e = document.getElementById($(this).attr('id'));
    //   var id = $(this).attr('id');
    //   var _e_arr = document.getElementsByName($(this).attr('id'));
    //   console.log(id);
    //   console.log(_e_arr.length);
    //   for (let i = 0; i < _e_arr.length; i++) {
    //     var e = _e_arr[i];
    //     console.log(e.id);
    //     if (current_status == 'expanded') {
    //       hide(e);
    //     } else {
    //       show(e);
    //     }
    //   }
    //   // toggle(e, 1500);
    //   // alert("test");
    //   if (current_status == 'expanded') {
    //   //   var id = $(this).attr('id');
    //   //   var delay = $('div[name='+id+']').find('div[class=tablerow]').length * 150;
    //   //   $('div[name='+id+']').hide('fold', {direction: 'up'}, delay);
    //     $(this).attr('menu-status', 'collapsed');
    //     // hide(e);
    //   } else {
    //   //   var id = $(this).attr('id');
    //   //   var delay = $('div[name='+id+']').find('div[class=tablerow]').length * 150;
    //   //   $('div[name='+id+']').show('fold', {direction: 'down'}, delay);
    //     $(this).attr('menu-status', 'expanded');
    //     // show(e);
    //   }
    // });
    
}

// [END] SMOOTH SHOW-HIDE ----------------------------------------------------------------------
