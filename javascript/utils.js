
// [START] Poly fill methods ---------------------------------------------------------------------------------------

if (typeof Element.prototype.getValue == "undefined") {
  Element.prototype.getValue = function (property, value) {
    var _val;
    if (this.tagName.toLowerCase() == 'input') {
      if (this.type.toLowerCase() == 'radio') {
        var _e_arr = document.getElementsByName(this.name);
        for (var i = 0, _length = _e_arr.length; i < _length; i++) {
          if (_e_arr[i].checked) {
            _val = _e_arr[i].value;
            break;
          }
        }
      } else if (this.type.toLowerCase() == 'checkbox') {
        _val = this.checked;
      } else {
        _val = this.value;
      }
    } else if (this.tagName.toLowerCase() == 'select') {
      _val = this.options[this.selectedIndex].value;
    } else if (this.tagName.toLowerCase() == 'textarea') {
      _val = this.value;
    } else if (this.tagName.toLowerCase() == 'option') {
      _val = this.value;
    } else {
      console.log("[getValue] Unsupported tag. Returning innerHTML for " + this.id);
      _val = this.innerHTML;
    }
    return _val;
  }
}

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

if (!String.prototype.initcap) {
  String.prototype.initcap = function() {
    'use strict';

    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };
}

if (Function.prototype.name === undefined){
  // Add a custom property to all function values
  // that actually invokes a method to get the value
  Object.defineProperty(Function.prototype,'name',{
    get:function(){
      return /function ([^(]*)/.exec( this+"" )[1];
    }
  });
}

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1. 
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

if (!String.prototype.splice) {
  /**
   * {JSDoc}
   *
   * The splice() method changes the content of a string by removing a range of
   * characters and/or adding new characters.
   *
   * @this {String}
   * @param {number} start Index at which to start changing the string.
   * @param {number} delCount An integer indicating the number of old chars to remove.
   * @param {string} newSubStr The String that is spliced in.
   * @return {string} A new string with the spliced substring.
   */
  String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
  };
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

// [END] Poly fill methods ---------------------------------------------------------------------------------------

var REQUIRED_FIELDS_HIGHLIGHT_BACKGROUND_COLOR = "red";
var REQUIRED_FIELDS_HIGHLIGHT_COLOR = "white";
var REQUIRED_FIELDS_HIGHLIGHT_BORDER_COLOR = "red";
var TEXTBOX_BACKGROUND_COLOR = "#fff8fb";
var TEXTBOX_BORDER_COLOR = "#CFCFCF";
var TEXT_COLOR = "#717171";
// var GOOGLE_MAPS_API_KEY = 'AIzaSyCRXv1cpuBAO5GFZhjR3VT96QOnbuGPvKY';

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function isValidEmailAddress(emailAddress) {
  if (emailAddress.trim() == "") {
    return false;
  }
  var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
  return pattern.test(emailAddress);
};

// function checkEmailFields() {
//   // Check for invalid email addresses. If so return false at the end
//   var emailValidation = true;
//   $('input[type=email][required]:visible').each(function () {
//     if (!isValidEmailAddress($(this).val())) {
//       if (emailValidation) {
//         postStatusBarErrorMessage("Please enter valid email addresses. Kindly check highlighted fields",5,false);
//         $(this).focus();
//       };
//       // $(this).css('border-color', REQUIRED_FIELDS_HIGHLIGHT_BORDER_COLOR);
//       $(this).addClass('textbox_error');
//       emailValidation = false;
//     }
//   });
//   return emailValidation;
// }

function checkEmailFields(fieldsArr) {
  var firstIncorrectField = "";
  for (var i = 0; i < fieldsArr.length; i++) {
    console.log("[checkFieldsNonEmpty] Checking " + fieldsArr[i]);
    if (!checkEmailField(fieldsArr[i], true)) {
      if (!firstIncorrectField) {
        firstIncorrectField = fieldsArr[i];
      }
    }
  }
  if (firstIncorrectField) {
    console.log("[checkFieldsNonEmpty] Missing data in " + firstIncorrectField);
    $('#'+firstIncorrectField).focus();
    return false;
  }
  return true;
}

function checkEmailField(pEmailField) {
  // Check for invalid email addresses. If so return false at the end
  var emailValidation = true;
  $('input[type=email][id=' + pEmailField + ']').each(function () {
    if (!isValidEmailAddress($(this).val())) {
      if (emailValidation) {
        postStatusBarErrorMessage('Please enter valid email addresses. Kindly check highlighted fields',5,false);
        $(this).focus();
      };
      // $(this).css('border-color', REQUIRED_FIELDS_HIGHLIGHT_BORDER_COLOR);
      // $(this).addClass('textbox_error');
      $("label[for='" + pEmailField + "']").addClass('textbox_error');
      emailValidation = false;
    }
  });
  return emailValidation;
}

function assignLabelsToInputs() {
  let _labels = document.getElementsByTagName('LABEL');
  for (let i = 0; i < _labels.length; i++) {
    if (_labels[i].htmlFor != '') {
      let _elements = [];
      let _e;

      console.log("[assignLabelsToInputs] htmlFor = " + _labels[i].htmlFor);
      if (_labels[i].htmlFor.endsWith('_hidden')) {
        let _name = _labels[i].name || _labels[i].htmlFor.replace(/_hidden$/, '');
        console.log("[assignLabelsToInputs] _name = " + _name);
        _e = document.getElementById(_name);
        if (_e) {
          _elements.push(_e);
        } else {
          let _t_elements = document.getElementsByName(_name);
          for (let k = 0; k < _t_elements.length; k++) {
            _e = _t_elements[k];
            _elements.push(_e); 
          }
        }
      }

      _e = document.getElementById(_labels[i].htmlFor);
      if (_e && (!_e.type || (_e.type.toLowerCase() !== 'checkbox' && _e.type.toLowerCase() !== 'radio'))) {
        _elements.push(_e);
      } else if (_e && _e.type && (_e.type.toLowerCase() == 'checkbox' || _e.type.toLowerCase() == 'radio')) {
        _e.text_label = _labels[i];
      }

      for (let j = 0; j < _elements.length; j++) {
        _elements[j].label = _labels[i];
      }
    }
  }  
}

function savePageInfoToInputs() {
  var _pages = document.getElementsByClassName('page');
  for (let i = 0; i < _pages.length; i++) {
    const _page = _pages[i];
    var _inputs = _page.getElementsByTagName("INPUT");
    let _pageNo = _page.getAttribute("page_no");
    let _pageName = _page.getAttribute("page_name");
    for (let j = 0; j < _inputs.length; j++) {
      _inputs[j].setAttribute("page_no", _pageNo || "");
      _inputs[j].setAttribute("page_name", _pageName || "");
    }
    var _inputs = _page.getElementsByTagName("SELECT");
    for (let j = 0; j < _inputs.length; j++) {
      _inputs[j].setAttribute("page_no", _pageNo || "");
      _inputs[j].setAttribute("page_name", _pageName || "");
    }
    var _inputs = _page.getElementsByTagName("TEXTAREA");
    for (let j = 0; j < _inputs.length; j++) {
      _inputs[j].setAttribute("page_no", _pageNo || "");
      _inputs[j].setAttribute("page_name", _pageName || "");
    }
  }
}

function initializeRequiredFields()
{
  assignLabelsToInputs();
  savePageInfoToInputs();
  // alert("radio");
  $('input,textarea,select').filter('[required]').each(function (i, requiredField) {
    if (requiredField.label && requiredField.type.toLowerCase() !== "radio") {
      requiredField.label.classList.add('label_required');
    }

    // Assigning functions to reset highlighted empty fields
    if (requiredField.type.toLowerCase() === "radio") {
      $('input[name=' + requiredField.name + ']').change(function () {
        if (this.label) {
          this.label.classList.remove('textbox_error');
        }
      });
    }
    else if (requiredField.type.toLowerCase() === "hidden" && requiredField.value === 'checkbox_group') {
      $('input[name=' + requiredField.name + ']').change(function () {
        if (requiredField.label) {
          requiredField.label.classList.remove('textbox_error');
        }
        // $("label[for='"+requiredFieldId+"']").css('background-color','');
        // $("label[for='"+requiredFieldId+"']").css('color',TEXT_COLOR);
      });
    }
    else {
      $(requiredField).keyup(function () {
        if (this.label) {
          this.label.classList.remove('textbox_error');
        }
        // $(requiredField).css('border-color', TEXTBOX_BORDER_COLOR);
        // $(this).removeClass('textbox_error');
      });
      $(requiredField).change(function () {
        if (this.label) {
          this.label.classList.remove('textbox_error'); 
        }
        // $(requiredField).css('border-color', TEXTBOX_BORDER_COLOR);
        // $(this).removeClass('textbox_error');
      });
    }
  });
}

function resetNonMandatoryFields()
{
  $('input,textarea,select').not('[required]').each(function(i, requiredField){
    if ($("label[for='"+requiredField.id+"']"))
    {
      if (requiredField.type.toLowerCase() !== "radio")
      {
        if ($("label[for='"+requiredField.id+"']").hasClass('label_required'))
        {
          $("label[for='"+requiredField.id+"']").removeClass('label_required');
        };
        
      }
    }
  });  
}

function clearField(fieldName) {
  var inputField = document.getElementById(fieldName);
  console.log("[clearField] Got " + fieldName);
  if (!inputField) {
    console.log("[clearField] ID " + fieldName + " not found");
  } else {
    console.log("[clearField] ID " + fieldName + " found. Tag = " + inputField.tagName);
    console.log("[clearField] Clearing " + fieldName);
    // Check radio buttons and highlight corresponding labels
    if (inputField.type.toLowerCase() === "radio") {
      $('input[name=' + inputField.name + ']').prop('checked', false);
    }
    // Check checkboxes and highlight corresponding labels
    if (inputField.type.toLowerCase() === "hidden") {
      if (inputField.value === 'checkbox_group') {
        $('input[name=' + inputField.name + ']').prop('checked', false);
      }
    }
    // Get field Id
    var inputFieldId = inputField.id;
    console.log("[clearField] " + fieldName + " is empty.");
    // Normal text inputs and dropdowns
    $(inputField).val('');
    if(inputField.tagName.toLowerCase() === 'select') {
      $(inputField).change();
    }
  }
}

function clearFields(fieldsArr) {
  for (var i = 0; i < fieldsArr.length; i++) {
    console.log("[clearFields] Clearing " + fieldsArr[i]);
    clearField(fieldsArr[i], true);
  }
  $('#' + fieldsArr[0]).focus();
}

function checkFieldNonEmpty(fieldName, checkIsVisible) {
  var inputField = document.getElementById(fieldName);
  console.log("[checkFieldNonEmpty] Got " + fieldName);
  if (!inputField) {
    console.log("[checkFieldNonEmpty] ID " + fieldName + " not found");
  } else {
    console.log("[checkFieldNonEmpty] ID " + fieldName + " found. Tag = " + inputField.tagName);
    if ($(inputField).is(":visible") || !checkIsVisible || (this.label && this.label.style.display !== 'none')) {
      console.log("[checkFieldNonEmpty] Checking " + fieldName);
      // Check radio buttons and highlight corresponding labels
      if (inputField.type.toLowerCase() == "radio") {
        if ($('input[name=' + inputField.name + ']:checked').length == 0) {
          $("label[for='" + inputField.name + "_hidden']").addClass('textbox_error');
          console.log("[checkFieldNonEmpty] " + fieldName + " is empty.");
          return false;
          // missingFieldsArr.push("radio button");
        }
      }
      // Check checkboxes and highlight corresponding labels
      if (inputField.type.toLowerCase() === "hidden") {
        if (inputField.value === 'checkbox_group') {
          if ($('input[name=' + inputField.name + ']:checked').length == 0) {
            $("label[for='" + fieldName + "']").addClass('textbox_error');
            console.log("[checkFieldNonEmpty] " + fieldName + " is empty.");
            return false;
            // missingFieldsArr.push("radio button");
          }
        }
      }
      // Get field Id
      var inputFieldId = inputField.id;
      // Check text inputs and dropdowns
      var _val = inputField.getValue();
      if (!_val || _val.trim() == '') {
        console.log("[checkFieldNonEmpty] " + fieldName + " is empty.");
        // Normal text inputs and dropdowns
        if (inputField.type.toLowerCase() != "radio") {
          // $(inputField).addClass('textbox_error');
          $("label[for='" + inputFieldId + "']").addClass('textbox_error');
        }
        // Hidden fields such as photo file
        if (inputField.type.toLowerCase() == "hidden") {
          if ($("label[for='" + inputFieldId + "']")) {
            $("label[for='" + inputFieldId + "']").addClass('textbox_error');
          }
        }
        // Get field name
        var missingFieldName = "";
        if ($("label[for='" + inputFieldId + "']")) {
          missingFieldName = $("label[for='" + inputFieldId + "']").text();
        }
        else {
          missingFieldName = $(inputField).attr('placeholder');
        }
        return false;
        // missingFieldsArr.push(missingFieldName);
      }
    }
  }
  return true;
}

function checkFieldsNonEmpty(fieldsArr)
{
  var firstMissingField = "";
  for (var i = 0; i < fieldsArr.length; i++) {
    console.log("[checkFieldsNonEmpty] Checking " + fieldsArr[i]);
    if (!checkFieldNonEmpty(fieldsArr[i], true)) {
      if (!firstMissingField) {
        firstMissingField = fieldsArr[i];
      }
    }
  }
  if (firstMissingField) {
    console.log("[checkFieldsNonEmpty] Missing data in " + firstMissingField);
    $('#'+firstMissingField).focus();
    return false;
  }
  return true;
}

function checkRequiredFields()
{
  // $('div').filter(':hidden').html('');
  let _missingFieldsArr = [];
  let _missingFieldsByPageMap = {}
  let _missingFieldsMsg = "";
  // $('input,textarea,select').filter('[id^=i_]:visible,[id$=_hidden]:hidden').filter('[required]').each(function(i, requiredField){
  $('input,textarea,select').filter('[id^=i_][required]').filter(function() {
    // console.log('[checkRequiredFields] Filtering field: ' + (this.id || this.name));
    let _is_visible = true;
    if (this.type && this.type.toLowerCase() === 'hidden') {
      // Allowing hidden fields to pass through for checkboxes
      if (this.value == 'checkbox_group') {
        if (this.label) {
          if (this.label.style.display === 'none') {
            _is_visible = false;
          }
        } else {
          _is_visible = false;
        }
      } else {
        _is_visible = false;
      }
    } else {
      if (this.style.display === 'none') {
        _is_visible = false;
      } else if (this.name && document.getElementById(this.name) && document.getElementById(this.name).style.display === 'none') {
        _is_visible = false;
      }            
    }
    return _is_visible;
  }).each(function(i, requiredField) {
    let _id = requiredField.id;
    let _type = requiredField.type.toLowerCase();
    let is_empty = !checkFieldNonEmpty(_id, false);
    let is_invalid_email = false;
    if (!is_empty && _type == 'email') {
      is_invalid_email = !checkEmailField(_id);
    }

    if (is_empty || is_invalid_email) {
      console.log('[checkRequiredFields] Missing field: ' + _id);

      let _page_no = requiredField.getAttribute("page_no");
      let _page_name = requiredField.getAttribute("page_name");
      let _page_prefix = "";
      if (_page_no) {
        _page_prefix = "[Page #" + _page_no + " - " + _page_name + "] ";
      }
      // console.log('[checkRequiredFields] Checking field ' + _id);
      let _label = _id;
      if (requiredField.label) {
        _label = requiredField.label.innerHTML + (is_invalid_email && " (<b>invalid email</b>)" || "");
      }

      if (!(_page_no in _missingFieldsByPageMap)) {
        _missingFieldsByPageMap[_page_no] = {
          'name': _page_name,
          'missing_fields': []
        }
      }
      if (!_missingFieldsByPageMap[_page_no]['missing_fields'].includes(_label)) {
        _missingFieldsByPageMap[_page_no]['missing_fields'].push(_label);
      }

      _label = _page_prefix + _label;
      if (!_missingFieldsArr.includes(_label)) {
        _missingFieldsArr.push(_label);
      }
    }
  });

  let _no_labels = 0;
  for (_page_no in _missingFieldsByPageMap) {
    _missingFieldsMsg += '<br><b>Page ' + _page_no + ' - ' + _missingFieldsByPageMap[_page_no]['name'] + '</b>';
    for (let i = 0; i < _missingFieldsByPageMap[_page_no]['missing_fields'].length; i++) {
      const _label = _missingFieldsByPageMap[_page_no]['missing_fields'][i];
      _missingFieldsMsg += '<br>' + _label;
      _no_labels++;
      if (_no_labels >= 5) {
        break;
      }
    }
    if (_no_labels >= 5) {
      break;
    }
  }
  if (_no_labels < _missingFieldsArr.length) {
    _missingFieldsMsg += '<br>... and ' + (_missingFieldsArr.length - _no_labels).toString() + ' more.';
  }

  return {
    'missing_fields_arr': _missingFieldsArr,
    'missing_fields_by_page_map': _missingFieldsByPageMap,
    'missing_fields_msg': _missingFieldsMsg
  };  
}

// https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
// Where el is the DOM element you'd like to test for visibility
// function isHidden(el) {
//   return (el.offsetParent === null)
// }
// If you position fixed elements, you will have to use window.getComputedStyle(). The function in that case will be:
// Option #2 is probably a little more straightforward since it accounts for more edge cases, but I bet its a good deal slower, too.
// Where el is the DOM element you'd like to test for visibility
// function isHidden(el) {
//   var style = window.getComputedStyle(el);
//   return (style.display === 'none')
// }

function isValidOrgEmailAddress(emailAddress) {
  if (!(emailAddress.endsWith('artofliving.org') || emailAddress.endsWith('iahv.org') || emailAddress.endsWith('@tlexprogram.com'))) {
    postStatusBarErrorMessage("The email address should be a valid artofliving.org, iahv.org or tlexprogram.com email address",5,false);
    return false;
  } else {
    return true;
  }
}

function isValidPhoneNo(inputtxt) {
  var phoneno = /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/;
  if (inputtxt.value.match(phoneno)) {
    return true;
  }  
  else {  
    alert("message");
    return false;
  }
}

function formatPhoneNo(s) {
  var s2 = (""+s).replace(/\D/g, '');
  var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
  return (!m) ? s : m[1] + "-" + m[2] + "-" + m[3];
}

function postFSMessage(msg,delay,persist)
{
  $("#txtHintFS").html(msg);
  $('#txtHintFSBG').show();
  $('#txtHintFS').show();
  if (!persist)
  {
    setTimeout(function() { 
      $("#txtHintFS").fadeOut(250);
      $("#txtHintFSBG").hide();
    }, (delay-0.25)*1000);
  }
}

function postStatusBarMessage(msg,delay,persist)
{
  if (!$('#txtHintError').is(':visible')) {
    $('#txtHintError').hide();
    $("#txtHint").html(
      '<div class="status_bar_inner_container">' +
        msg + 
      '</div>'
    );
    $('#txtHint').show();
    if (!persist)
    {
      setTimeout(function() { 
        $("#txtHint").fadeOut(250);
      }, (delay-0.25)*1000);
    }
  }
}

function postStatusBarErrorMessage(msg,delay,persist)
{
  var _buttons = "";
  if (persist) {
     _buttons = '<br><br>' + 
        '<a class="an-simple-button" onclick="closeStatusBarMessage()">&nbsp;&nbsp;Ok&nbsp;&nbsp;</a>';
  }
	$('#txtHint').hide();
	$('#txtHintError').show();
  $("#txtHintError").html(
    '<div class="status_bar_inner_container">' +
      '<i class="fa fa-times-circle fa-5x" aria-hidden="true"></i><br>' + msg + _buttons +
    '</div>'
  );
  if (!persist)
  {
    setTimeout(function() { 
      $("#txtHintError").hide();
    }, delay*1000);
  }
}

function postErrorMessage(msg)
{
  postStatusBarErrorMessage(msg,5,false);
}

function postFSErrorMessage(msg) {
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  postFSMessage(
    '<div style="background-color:white;margin: 0 auto;border-radius: 5px;text-align:left;display:table;">' +
      '<div style="display:table-row;">' +
        '<div style="display:table-cell; padding:13px;">' +
          '<div style="overflow-y: scroll;">' +
            '<i class="fa fa-times-circle fa-5x" aria-hidden="true"></i><br>' + msg +
          '</div>' +     
        '</div>' + 
      '</div>' + 
      '<div style="display:table-row;">' +
        '<div style="display:table-cell; padding:13px;">' +
          '<hr class="gradient-separator">' +
          '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage();">' + 
          '<i class="fa fa-check fa-lg" aria-hidden="true"></i>&nbsp;Ok</a>&nbsp;&nbsp;' + 
        '</div>' + 
      '</div>' + 
    '</div>',
    0,
    true
  );
}

function postDoneMessage(msg) {
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  postStatusBarMessage('<i class="fa fa-check-circle fa-5x status_bar_done_sign" aria-hidden="true"></i>' + msg,1,false);
}

function postInfoMessage(msg, delay, persist) {
  persist = typeof persist !== 'undefined' ? persist : false;
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  postStatusBarMessage('<i class="fa fa-info-circle fa-5x status_bar_info_sign" aria-hidden="true"></i>' + msg,delay,persist);
}

function postWarningMessage(msg, delay, persist) {
  persist = typeof persist !== 'undefined' ? persist : false;
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  if (!persist) {
    postStatusBarMessage('<i class="fa fa-exclamation-circle fa-5x status_bar_info_sign" aria-hidden="true"></i>' + msg,delay,false);
  } else {
    postStatusBarMessage(
      '<div class="status_bar_inner2_container">' +
        '<i class="fa fa-exclamation-circle fa-5x status_bar_info_sign" aria-hidden="true"></i>' + msg + '<br><br>' + 
        '<a id="btn_get_course_details" class="an-simple-button" onclick="closeStatusBarMessage()">&nbsp;&nbsp;Ok&nbsp;&nbsp;</a>' + 
      '</div>',
      0,
      true
    );
  }

}

function postRedirectMessage(msg, redirect_url) {
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  postStatusBarMessage(
    '<div class="status_bar_inner2_container">' +
      '<i class="fa fa-info-circle fa-5x status_bar_info_sign" aria-hidden="true"></i>' + msg + '<br><br>' + 
      '<a id="btn_get_course_details" class="an-simple-button" target="_blank" href="'+redirect_url+'">' + 
      '<i class="fa fa-external-link fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;Redirect</a>&nbsp;&nbsp;' + 
      '<a id="btn_get_course_details" class="an-simple-button" onclick="closeStatusBarMessage()"><i class="fa fa-times fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;Cancel</a>' + 
    '</div>',
    0,
    true
  );
}

function postAgreementMessage(msg, yes_function, no_function) {
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  postFSMessage(
    '<div style="background-color:white;margin: 0 auto;border-radius: 5px;text-align:left;display:table;">' +
      '<div style="display:table-row;">' +
        '<div style="display:table-cell; padding:13px;">' +
          '<div style="overflow-y: scroll;">' +
            '<i class="fa fa-pencil-square-o fa-5x status_bar_info_sign" aria-hidden="true"></i><br>' + msg +
          '</div>' +     
        '</div>' + 
      '</div>' + 
      '<div style="display:table-row;">' +
        '<div style="display:table-cell; padding:13px;">' +
          '<hr class="gradient-separator">' +
          '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage(); '+yes_function.name+'();">' + 
          '<i class="fa fa-check fa-lg" aria-hidden="true"></i>&nbsp;&nbspYes</a>&nbsp;&nbsp;' + 
          '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage(); '+no_function.name+'();">' + 
          '<i class="fa fa-times fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;No</a>' + 
        '</div>' + 
      '</div>' + 
    '</div>',
    0,
    true
  );
}

function showCountrySelector() {
  postFSMessage(
    '<div style="background-color:white;margin: 0 auto;padding:13px;border-radius: 5px;text-align:left;display:table;">' +
    '<div style="display:table-row;">' +
    '<div style="display:table-cell;">' +
    '<div style="overflow-y: scroll;">' +
    '<i class="fa fa-pencil-square-o fa-5x status_bar_info_sign" aria-hidden="true"></i><br>' +
    'Please select your country below:' + 
    '<SELECT' +
    '<option value="US">United States</option>' +
    '<option value="CA">Canada</option>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div style="display:table-row;">' +
    '<div style="display:table-cell;">' +
    '<hr class="gradient-separator">' +
    '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage(); ' + yes_function.name + '();">' +
    '<i class="fa fa-check fa-lg" aria-hidden="true"></i>&nbsp;&nbspYes</a>&nbsp;&nbsp;' +
    '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage(); ' + no_function.name + '();">' +
    '<i class="fa fa-times fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;No</a>' +
    '</div>' +
    '</div>' +
    '</div>',
    0,
    true
  );
}

function postYesNoMessage(msg, yes_function, no_function) {
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  postFSMessage(
    '<div style="background-color:white;margin: 0 auto;padding:13px 0px;border-radius: 5px;">' +
    msg + '<br><br>' + 
    '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage(); '+yes_function.name+'();">' + 
    '<i class="fa fa-check fa-lg" aria-hidden="true"></i>&nbsp;&nbspYes</a>&nbsp;&nbsp;' + 
    '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage(); '+no_function.name+'();">' + 
    '<i class="fa fa-times fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;No</a><br><br>' +
    '</div>',
    0,
    true
  );
}

function postFullscreenMessage(msg) {
  if (msg) {
    msg = '<br>' + msg;
  } else {
    msg = '';
  }
  postFSMessage(
    '<div style="background-color:white;margin: 0 auto;padding:13px 0px;border-radius: 5px;">' +
    msg + '<br><br>' +
    '<a id="btn_get_course_details" class="an-simple-button" onclick="closeFSMessage();">' +
    '<i class="fa fa-times fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;Close</a>' +
    '</div>',
    0,
    true
  );
}

function closeStatusBarMessage() {
  $('#txtHint').hide();
  $('#txtHintError').hide();
}

function closeFSMessage() {
  $('#txtHintFS').hide();
  $('#txtHintFSBG').hide();
}

function splitAddress(pAddress) {
  var addressArr = pAddress.trim().split(',');
  var address = {};
  if (pAddress) {
    var zipOffset = 1;
    if (isNaN(addressArr[addressArr.length-1].trim())) {
      zipOffset = 0;
      address['zip'] = "";
    } else {
      address['zip'] = addressArr[addressArr.length-1].trim();
    }
    if (addressArr.length-zipOffset == 5) {
      address['street_address_2'] = addressArr[1].trim();
    } else {
      address['street_address_2'] = "";
    }
    address['street_address_1'] = addressArr[0].trim();
    address['country'] = addressArr[addressArr.length-1-zipOffset].trim();
    address['state'] = addressArr[addressArr.length-2-zipOffset].trim();
    address['city'] = addressArr[addressArr.length-3-zipOffset].trim();
  }
  return address;
}



function isNumber(evt) {
  evt = (evt) ? evt : window.event;
  var charCode = (evt.which) ? evt.which : evt.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
  }
  return true;
}

function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  }
  else {
    return uri + separator + key + "=" + value;
  }
}



const COLOR_STATUS_COMPLETE = '#00a651';
const COLOR_STATUS_SUBMITTED = '#00a259';
const COLOR_STATUS_UNSUBMITTED = '#0071b6';
const COLOR_STATUS_IN_PROGRESS = '#e37458';
const COLOR_STATUS_UNKNOWN = '#555';
const COLOR_STATUS_PENDING = '#92341a';

function getStatusColor(status) {
  if (status.startsWith('complete')) {
    return COLOR_STATUS_COMPLETE;
  } else if (status.startsWith('submitted')) {
    return COLOR_STATUS_SUBMITTED;
  } else if (status == 'filled') {
    return COLOR_STATUS_UNSUBMITTED;
  } else if (status == 'in progress') {
    return COLOR_STATUS_IN_PROGRESS;
  } else if (status == 'pending') {
    return COLOR_STATUS_IN_PROGRESS;
  } else {
    return COLOR_STATUS_UNKNOWN;
  }
}


function getREPattern(pattern) {
  let _p = '';
  for (let i = 0; i < pattern.length; i++) {
    const e = pattern[i];
    if ('0123456789'.indexOf(e) !== -1) {
      _p += '[0-9]';
    } else if (e.match(/[a-zA-Z]/)) {
      _p += '[a-zA-Z]'
    } else {
      _p += '\\' + e;
    }
  }
  return _p;
}


function getPattern(pattern) {
  let _p = '';
  for (let i = 0; i < pattern.length; i++) {
    const e = pattern[i];
    if ('0123456789'.indexOf(e) !== -1) {
      _p += '9';
    } else if (e.match(/[a-zA-Z]/)) {
      _p += 'a'
    } else {
      _p += e;
    }
  }
  return _p;
}

function validatePattern(pattern, s) {
  let _re = '^';
  _re += getREPattern(pattern);
  _re += '$';
  let re = new RegExp(_re);
  if (s.match(re)) {
    return true;
  } else {
    return false;
  }
}


function maskString(str, pattern, start, end, str_add) {
  let _v = str;
  let _no_chars_added = 0;
  let _no_chars_removed = end - start;
  let _start = start;
  let _end = end;
  for (let k = 0; k < str_add.length; k++) {
    const _c = str_add[k];
    const _k = _c.charCodeAt(0);
    console.log('[maskString] _c = ' + _c);
    console.log('[maskString] _v = ' + _v);
    console.log('[maskString] _start = ' + _start);
    console.log('[maskString] _end = ' + _end);

    if (_v.length >= pattern.length && _start >= _v.length) {
      break;
    }

    if ('0123456789'.indexOf(_c) !== -1) {
      console.log('[maskString] input is number');
      for (let i = _start; i < pattern.length; i++) {
        const _e = pattern[i];
        if (_e == '9') {
          _v = _v.splice(_start, _end - _start, _c);
          _no_chars_added++;
          _start++;
          _end = _start;
          break;
        } else if (_e == 'a') {
          break;
        } else {
          _v = _v.splice(_start, _end - _start, _e);
          _no_chars_added++;
          _start++;
          _end = _start;
        }
      }
    } else if (_c.match(/[a-zA-Z]/)) {
      console.log('[maskString] input is character');
      for (let i = _start; i < pattern.length; i++) {
        const _e = pattern[i];
        console.log('[maskString] _e = ' + _e);
        if (_e == '9') {
          break;
        } else if (_e == 'a') {
          _v = _v.splice(_start, _end - _start, _c);
          _no_chars_added++;
          _start++;
          _end = _start;
          break;
        } else {
          _v = _v.splice(_start, _end - _start, _e);
          _no_chars_added++;
          _start++;
          _end = _start;
        }
      }
    } else if (_c == pattern[_start]) {
      _v = _v.splice(_start, _end - _start, _c);
      _no_chars_added++;
      _start++;
      _end = _start;
    } else {
      if (_k === 8 || _k === 127) {
        _v = _v.splice(_start, _end - _start, _c);
      } else {
      }
    }
  }
  let _t = _v;
  _v = _v.substring(0, pattern.length);
  let _delta = _no_chars_added - _no_chars_removed;
  console.log('[maskString] _no_chars_added = ' + _no_chars_added);
  console.log('[maskString] _no_chars_removed = ' + _no_chars_removed);
  console.log('[maskString] _delta = ' + _delta);
  return {
    no_chars_added: _no_chars_added,
    no_chars_removed: _no_chars_removed,
    no_chars_delta: _delta,
    str: _v,
    full_str: _t
  };
}


function maskTextboxInput(e) {
  let _pattern = getPattern(this.getAttribute('mask-pattern'));
  if (_pattern) {
    let _s = undefined;
    if (window.clipboardData && window.clipboardData.getData) { // IE
      _s = window.clipboardData.getData('Text');
    } else if (e.clipboardData && e.clipboardData.getData) {
      _s = e.clipboardData.getData('text/plain');
    } else {
      let _key = e.which || e.charCode || e.keyCode || 0;
      console.log('[maskTextboxInput] _key = ' + _key);
      _s = e.char || String.fromCharCode(_key);;
    }
    console.log('[maskTextboxInput] _s = ' + _s);
    let _v = this.value;
    let _start = this.selectionStart;
    let _end = this.selectionEnd;
    e.preventDefault();
    let _o1 = maskString(_v, _pattern, _start, _end, _s);
    _v = _o1.str;
    console.log('[maskTextboxInput] _v [1] = ' + _v);

    if (_o1.no_chars_delta !== 0 && _v !== _s) {
      let _fix_start = _start + _o1.no_chars_delta;
      if (_fix_start < _v.length - 1) {
        let _o2 = maskString(_o1.str.substring(0, _fix_start), _pattern, _fix_start, _fix_start, _o1.full_str.substring(_fix_start).replace(/[^a-zA-Z0-9]*/g, ''));
        _v = _o2.str;
        console.log('[maskTextboxInput] _v [2] = ' + _v);
      }
    }
    this.value = _v;

    let _new_pos = _end + _o1.no_chars_delta;
    if (this.createTextRange) {
      var range = this.createTextRange();
      range.move('character', _new_pos);
      range.select();
    }
    else {
      if (this.selectionStart) {
        this.focus();
        this.setSelectionRange(_new_pos, _new_pos);
      }
      else
        this.focus();
    }

    return false;
  }

  return true;    
};


// -- [START] BROWSER CHECK --------------------------------------------------------------------------------------------------

var is_compatible_browser = true;

function isIE() {
  var myNav = navigator.userAgent.toLowerCase();
  return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
}

var _ie_version = isIE();
if (_ie_version == 7 || _ie_version == 8) {
  is_compatible_browser = false;
  window.location = "/disabled";
}
// else if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
else if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  is_compatible_browser = false;
  window.location = "/disabled";
}
else if ((_ie_version >= 9) && (_ie_version <= 11)) {
  is_compatible_browser = false;
}
else if (/Chrome[\/\s](\d+\.\d+)/.test(navigator.userAgent))
  ;
else if (/Safari[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
  is_compatible_browser = false;
}
else if (/Mozilla[\/\s](\d+\.\d+)/.test(navigator.userAgent))
  ;
else
  window.location = "/disabled";

function checkBrowserVersion() {
  console.log('[checkBrowserVersion] checking browser version');
  if (!is_compatible_browser) {
    console.log('[checkBrowserVersion] incompatible version detected');
    postWarningMessage("You are using an incompatible browser. We recommend using <a target='_blank' href='https://www.google.com/chrome/'>Google Chrome</a>.", 0, true);
  }  
}

// -- [END] BROWSER CHECK ----------------------------------------------------------------------------------------------------

const date_formats = [
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'MM/dd/yy',
    'dd/MM/yy'
];

function string2date(datestr) {
  let _date = null;
  for (let i = 0; i < date_formats.length && _date === null; i++) {
      const _date_format = date_formats[i];
      try {
          _date = Date.parseString(datestr, _date_format);
      } catch (err) {
          _date = null;
      }
  }
  return _date;
}

function calculateAge(dob) {
  if (dob) {
    var d_dob = new Date(dob);
    var ageDifMs = Date.now() - d_dob.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}

function isNull(value){
    return (typeof value === "undefined" || value === null);
}

function isEmpty(value){
    return (typeof value === "undefined" || value === null || value.toString().trim().length === 0);
}

function array2bullets(arr) {
  if (arr.length > 0) {
    let _bullet = "- ";
    return _bullet + arr.join("<br>" + _bullet);
  } else {
    return '';
  }
}

function dict2bullets(dict) {
  let _arr = [];
  for (var k in dict) {
    _arr.push(k + ": " + dict[k]);
  }
  return array2bullets(_arr);
}

// [START] Show Hide Functions
function getShowHideHTML(
  content, 
  id_suffix = '', 
  show_char_count = 100,
  show_button_text = '(show more)',
  hide_button_text = '(hide)',
  show_single_line = false
) {
  let _content = '';
  if (!isEmpty(content)) {
    _content = content.toString();
  }
  let _id_suffix = id_suffix;
  if (id_suffix != '') {
    _id_suffix = '-' + id_suffix;
  }
  if (show_single_line) {
    let _actual_content = '';
    let _br_index = _content.toLowerCase().indexOf('<br');
    if (_br_index >= 0) {
      // var _el = document.createElement('html');
      // _el.innerHTML = _content;
      // _br_arr = _el.getElementsByTagName('br');
      // for (let i = 0; i < _br_arr.length; i++) {
      //   const e = _br_arr[i];
      //   e.remove();
      // }
      _actual_content = '<span id="shActualContent' + _id_suffix + '" style="display:none;">' +
          _content +
        '</span>';
      _content = _content.replace(/<br\s*\/?>/gi,'&nbsp;');
    }
    _content = '' +
      '<div id="shMore' + _id_suffix + '" style="text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">' +
        '<span id="shShowButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + show_button_text + '\', \'' + hide_button_text + '\', true)" style="color:blue;cursor:pointer;display:none; font-family:\'Ubuntu Mono\',monospace;">' + show_button_text + '</span>&nbsp;' + 
        '<span id="shHideButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + show_button_text + '\', \'' + hide_button_text + '\', true)" style="color:blue;cursor:pointer;display:none; font-family:\'Ubuntu Mono\',monospace;">' + hide_button_text + '</span>&nbsp;' + 
        _content + 
      '</div>' +
      _actual_content;
  } else {
    let _btn_sep = '<br>';
    let _hide_controls_length = show_button_text.length + 4;
    let _hide_buf = _hide_controls_length + 3;
    if (show_char_count <= 23) {
      _btn_sep = '&nbsp;';
      _hide_buf = 0;
    }
    if (_content.length > show_char_count + _hide_buf) {
      let _visible_text = _content.substring(0, show_char_count - _hide_controls_length);
      let _hidden_text = _content.substring(show_char_count - _hide_controls_length);
      _content = _visible_text + 
        '<span id="shDots' + _id_suffix + '">...</span>' +
        '<span id="shMore' + _id_suffix + '" style="display:none;">' + 
          _hidden_text + 
        '</span>' + 
        _btn_sep + 
        '<span id="shButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + show_button_text + '\', \'' + hide_button_text + '\', false)" style="color:blue;cursor:pointer;display:inline-block; font-family:\'Ubuntu Mono\',monospace;">' + 
          show_button_text + 
        '</span>';
    }
  }
  return _content;
}

function showHide(
  id_suffix = '',
  show_button_text,
  hide_button_text,
  show_single_line
) {
  // console.log('[showHide] called for ' + id_suffix);
  if (show_single_line) {
    let _content = document.getElementById("shMore" + id_suffix);
    let _actualContent = document.getElementById("shActualContent" + id_suffix);
    // let _btnShowText = document.getElementById("shShowButton" + id_suffix);
    // let _btnHideText = document.getElementById("shHideButton" + id_suffix);

    if (_content.style.overflow === "hidden" && _content.style.display !== "none") {
      if (_actualContent) {
        _actualContent.style.display = "inline-block";
        _content.style.display = "none";
      } else {
        _content.style.overflow = "visible";
      }
      // _btnShowText.style.display = "none";
      // _btnHideText.style.display = "inline-block";
    } else {
      if (_actualContent) {
        _actualContent.style.display = "none";
        _content.style.display = "inline-block;";
      } else {
        _content.style.overflow = "hidden";
      }
      // _btnShowText.style.display = "inline-block";
      // _btnHideText.style.display = "none";
    }    
  } else {
    let _dots = document.getElementById("shDots" + id_suffix);
    let _moreText = document.getElementById("shMore" + id_suffix);
    let _btnText = document.getElementById("shButton" + id_suffix);

    if (_dots.style.display === "none") {
      _dots.style.display = "inline";
      _btnText.innerHTML = show_button_text;
      _moreText.style.display = "none";
    } else {
      _dots.style.display = "none";
      _btnText.innerHTML = hide_button_text;
      _moreText.style.display = "inline";
    }
  }
}

function showAllChildren(parent) {
  let _parent = parent;
  // If its not a JQuery object
  if (!_parent instanceof Object) {
    _parent = $('#' + _parent);
  }
  _parent.find("[id^='shShowButton'],[id^='shButton']").click();
}

function hideAllChildren(parent) {
  let _parent = parent;
  // If its not a JQuery object
  if (!_parent instanceof Object) {
    _parent = $('#' + _parent);
  }
  parent.find("[id^='shShowButton'],[id^='shButton']").click();
}
// [END] Show Hide Functions
