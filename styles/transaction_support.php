<script type="text/javascript" src="javascript/jquery-1.11.1.min.js"></script>
<script type="text/javascript" src="javascript/jquery-ui/jquery-ui.js"></script>
<script type="text/javascript" src="javascript/utils.js"></script>
<link rel="stylesheet" href="javascript/jquery-ui/jquery-ui.css" type="text/css"/>
<link rel="stylesheet" href="styles/jquery-ui-custom.css" type="text/css" />
<script type="text/javascript">
  function prepareTicket () {
    // Assign variable a value.
    // NOTE: ticketDetails is already declared.
    ticketDetails = { 
      jira_details: {
        fields: {
         project:
         {
          key: 'PROJECT_KEY'
        },
        summary: "",
        description: "",
        issuetype: {
          name: ""
        }
      }
    }
  };
    // SAMPLE value assigns
    // If an email is required to requestor, assign requestor_name and requestor_email
    // NOTES:
    // - The custom field numbers are for example only
    // - All fields need to be appended to description. This description gets displayed on the confirmation screen.
    // Combining two fields into one
    var name = $('#i_fname').val() + " " + $('#i_lname').val();
    ticketDetails.jira_details.fields.description += "Name: " + name + "\n";
    ticketDetails.requestor_name = name;
    ticketDetails.jira_details.fields.customfield_12345 = $('#i_fname').val();
    ticketDetails.jira_details.fields.customfield_23456 = $('#i_lname').val();
    var requestorEmail = $('#i_email').val();
    ticketDetails.jira_details.fields.description += "Alternate Email: " + requestorEmail + "\n";
    ticketDetails.requestor_email = requestorEmail;
    ticketDetails.jira_details.fields.customfield_34567 = requestorEmail;
    var additionalDetails = $('#i_additional_details').val();
    ticketDetails.jira_details.fields.description += "Additional Details: " + additionalDetails + "\n";
    // Assign a value to the summary field, which becomes the subject of the JIRA ticket
    // ticketDetails.jira_details.fields.summary = variable
    return true;
  }
  function showInputs(stepNo) {
    if (stepNo == 3) {
      switch($('input[name="i_org"]:checked').attr("id")) {
        case "i_org_aol":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').slideDown("slow");
        break;
        case "i_org_iahv":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_iahv]').slideDown("slow");
        break;
        default:
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').slideDown("slow");
        break;
      }     
    }else if (stepNo == 4) {
      switch($('input[name="i_req_cat"]:checked').attr("id")) {
        case "i_req_cat_login":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_1_login_user_issues]').slideDown("slow");
        break;
        case "i_req_cat_course_acct":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_2_course_accounting_issues]').slideDown("slow");
        break;
        case "i_req_cat_gen_course":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_3_general_course_issues]').slideDown("slow");
        break; 
        case "i_req_cat_req_admin":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_4_request_admin_access]').slideDown("slow");
        break;  
        case "i_req_cat_req_other":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_5_other]').slideDown("slow");
        break;              
        default:
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        break;
      }
    }
    else if (stepNo == 5) {      
      switch($('input[name="i_login_issues"]:checked').attr("id")) {
        case "i_login_issues_reset_pwd":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_1_login_user_issues]').show();
        $('span[name=step_3_1_1_reset_pwd_email_name]').slideDown("slow");
        break;
        case "i_login_issues_change_email_name":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_1_login_user_issues]').show();
        $('span[name=step_3_1_2_change_email_name]').slideDown("slow");
        break;      
        case "i_login_issues_signed_up_cant_login":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_1_login_user_issues]').show();
        $('span[name=step_3_1_3_cannot_login]').slideDown("slow");
        break;
        case "i_login_issues_unable_to_see_courses":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_1_login_user_issues]').show();
        $('span[name=step_3_1_4_unable_to_view_courses]').slideDown("slow");
        break;
        case "i_login_issues_other":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_aol]').show();
        $('span[name=step_3_1_login_user_issues]').show();
        $('span[name=step_3_1_5_other]').slideDown("slow"); 
        break;                  
        default:
          break;
        }
      }
      else if (stepNo == 6) {
        switch($('input[name="i_course_acct_issues"]:checked').attr("id")) {
          case "i_course_acct_issues_cancel":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_2_course_accounting_issues]').show();
          $('span[name=step_3_2_1_cancel_course_after_complete]').slideDown("slow");
          break;
          case "i_course_acct_issues_add_remove_teacher":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_2_course_accounting_issues]').show();
          $('span[name=step_3_2_2_add_remove_teacher').slideDown("slow");
          break;
          case "i_course_acct_issues_reject_course_acct":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_2_course_accounting_issues]').show();
          $('span[name=step_3_2_3_edit_submitted_course_acct').slideDown("slow");
          break;
          case "i_course_acct_issues_course_transfer":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_2_course_accounting_issues]').show();
          $('span[name=step_3_2_4_course_transfer]').slideDown("slow");
          break;
          case "i_course_acct_issues_course_refund":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_2_course_accounting_issues]').show();
          $('span[name=step_3_2_5_course_refund]').slideDown("slow");
          break;
          case "i_course_acct_issues_change_course_fee":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_2_course_accounting_issues]').show();
          $('span[name=step_3_2_6_course_change_fee]').slideDown("slow");
          break;
          case "i_course_acct_issues_other":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_2_course_accounting_issues]').show();
          $('span[name=step_3_2_7_other]').slideDown("slow");
          break;
        }
      }
      else if (stepNo == 7) {
        switch($('input[name="i_general_course_issues"]:checked').attr("id")){
          case "i_change_event_quick_reg":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_3_general_course_issues]').show();
          $('span[name=step_3_3_1_change_event_quick_reg]').slideDown("slow");
          break;
          case "i_course_not_visible":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_3_general_course_issues]').show();
          $('span[name=step_3_3_2_course_not_visible]').slideDown("slow");
          break;
          case "i_hidden_courses_events":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_3_general_course_issues]').show();
          $('span[name=step_3_3_3_link_for_hidden_courses]').slideDown("slow");
          break;
          case "i_other":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_3_general_course_issues]').show();
          $('span[name=step_3_3_4_other]').slideDown("slow");
          break;
        }
      }
      else if (stepNo == 8) {
        switch($('input[name="i_completed_volunteer_train"]:checked').attr("id")){
          case "i_completed_volunteer_train_yes":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_4_request_admin_access]').show();
          $('span[name=step_3_4_1_completed_vol_train_yes]').slideDown("slow");
          break;
          case "i_completed_volunteer_train_no":
          $('span[name^=step_3_]').hide();
          $('span[name=step_3_aol]').show();
          $('span[name=step_3_4_request_admin_access]').show();
          $('span[name=step_3_4_2_completed_vol_train_no]').slideDown("slow");
          break;
        }
      }
      else if (stepNo == 9){
       switch($('input[name="i_iahv_choice"]:checked').attr("id")){
        case "i_iahv_request_admin_access":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_iahv]').show();
        $('span[name=step_3_1_iahv_request_admin_access]').slideDown("slow");
        break;
        case "i_iahv_other":
        $('span[name^=step_3_]').hide();
        $('span[name=step_3_iahv]').show();
        $('span[name=step_3_2_iahv_other]').slideDown("slow");
        break;
      }
    }
  }

  $(document).ready(function() {
    initializeRequiredFields();
    $('input[name="i_org"]').change(function () {
      if ($('input[name="i_org"]:checked').is(':checked')) {
        showInputs(3);
      };
    });
    $('input[name="i_req_cat"]').change(function () {
      if ($('input[name="i_req_cat"]:checked').is(':checked')) {
        showInputs(4);
      };
    });
    $('input[name="i_login_issues"]').change(function () {
      if ($('input[name="i_login_issues"]:checked').is(':checked')) {
        showInputs(5);
      };
    });
    $('input[name="i_course_acct_issues"]').change(function () {
      if ($('input[name="i_course_acct_issues"]:checked').is(':checked')) {
        showInputs(6);
      };
    });
    $('input[name="i_general_course_issues"]').change(function () {
      if ($('input[name="i_general_course_issues"]:checked').is(':checked')) {
        showInputs(7);
      };
    });
    $('input[name="i_completed_volunteer_train"]').change(function () {
      if ($('input[name="i_completed_volunteer_train"]:checked').is(':checked')) {
        showInputs(8);
      };
    });
    $('input[name="i_iahv_choice"]').change(function () {
      if ($('input[name="i_iahv_choice"]:checked').is(':checked')) {
        showInputs(9);
      };
    });
  }); // When the page first loads
</script>

<div style="margin: 0 auto;" class="site-container">
  <div class="site-inner-container">
    <div id="email_form" class="form-tab-content" style="display:table;text-align:center;margin:0 auto;">
      <!-- HEADER SECTION -->
      <div class="tablebody">
        <div class="tablerow">
          <div class="tablecell">
            <div id="deepen" class="form-header-block" style="text-align: left;">
              Transaction Support
              <div class="smallertext" style="margin-top:7px;">
                Transaction Support <span style="font-weight:bold;color:red;">DO NOT USE, WORK IN PROGRESS</span>
              </div>
              <!-- <hr class="gradient-separator"> -->
              <hr class="left-gradient-separator">
            </div>
          </div>
        </div>
      </div>

      <!-- 
        SECTION WITH ALL FORM INPUTS 
        NOTES:
        - Do not change the id - step_form
        - All inputs are to be named i_XXX, preferrably with an "_" separating words
      -->
      <div id="step_form" class="tablebody">
        <!-- 
          SECTION TITLE
          Here we have the title for Requestor Info. Similarly other sections may be created.
          For sections that reveal based on inputs, please refer to usage of SPAN usage to create 
          sections in email_support.php
        -->
        <span name="step_1">
          <div class="tablerow">
            <div class="tablecell">
              <label for="i_fname">First Name</label>
            </div>
            <div class="tablecell">
              <input id="i_fname" type="textbox" placeholder="First Name *" required>
            </div>
          </div>

          <div class="tablerow">
            <div class="tablecell">
              <label for="i_lname">Last Name</label>
            </div>
            <div class="tablecell">
              <input id="i_lname" type="textbox" placeholder="Last Name *" required>
            </div>
          </div>

          <div class="tablerow">
            <div class="tablecell">
              <label for="i_email">Email Address</label>
            </div>
            <div class="tablecell">
              <input id="i_email" type="email" placeholder="Email Address *" required>
            </div>
          </div>
        </span>

        <span name="step_2" >
          <div class="tablerow">
            <div class="tablecell">
              <label for="i_org_hidden">Select an organization</label>
              <input type="hidden" id="i_org_hidden" required>
            </div>
            <div class="tablecell">
              <form>
                <input type="radio" id="i_org_aol" name="i_org" required>&nbsp;<label for="i_org_aol">Art of Living/VVM</label>
                <br>
                <input type="radio" id="i_org_iahv" name="i_org">&nbsp;<label for="i_org_iahv">IAHV</label>
              </form>
            </div>
          </div>
        </span>

        <span name="step_3_aol" style="display:none;">
            <div class="tablerow" style="display:block;">
              <div class="tablecell">
                <label for="i_req_cat_hidden">Request category:</label>
                <input type="hidden" id="i_req_cat_hidden" required>
                <div class="smallertext">
                  Select the category/type that matches your requirement
                </div>
              </div>
              <div class="tablecell">
                <form>
                  <input type="radio" id="i_req_cat_login" name="i_req_cat" required>&nbsp;<label for="i_req_cat_login">Login and User Profile issues</label>
                  <br>
                  <input type="radio" id="i_req_cat_course_acct" name="i_req_cat" required>&nbsp;<label for="i_req_cat_course_acct">Course accounting issues</label>
                  <br>
                  <input type="radio" id="i_req_cat_gen_course" name="i_req_cat" required>&nbsp;<label for="i_req_cat_gen_course">General course issues</label>
                  <br>
                  <input type="radio" id="i_req_cat_req_admin" name="i_req_cat" required>&nbsp;<label for="i_role_aol_non_us">Request admin access</label>
                  <br>
                  <input type="radio" id="i_req_cat_req_other" name="i_req_cat" required>&nbsp;<label for="i_role_aol_admin_account">Other</label>
                </form>
              </div>
            </div>
          </span>
        
          <!-- Login issues -->
          <span name="step_3_1_login_user_issues" style="display:none;">
            <div class="tablerow" style="display:block;">
              <div class="tablecell">
                <label for="i_login_issues_hidden">Issue Type</label>
                <input type="hidden" id="i_login_issues_hidden" required>
              </div>
              <div class="tablecell">
                <form>
                  <input type="radio" id="i_login_issues_reset_pwd" name="i_login_issues" required>&nbsp;<label for="i_login_issues_reset_pwd">Reset Password</label>
                  <br>
                  <input type="radio" id="i_login_issues_change_email_name" name="i_login_issues" required>&nbsp;<label for="i_login_issues_change_email_name">Change existing user name and Email id</label>
                  <br>
                  <input type="radio" id="i_login_issues_signed_up_cant_login" name="i_login_issues" required>&nbsp;<label for="i_login_issues_signed_up_cant_login">Signed up but cannot login</label>
                  <br>
                  <input type="radio" id="i_login_issues_unable_to_see_courses" name="i_login_issues" required>&nbsp;<label for="i_login_issues_unable_to_see_courses">Unable to see all course registered</label>
                  <br>
                  <input type="radio" id="i_login_issues_other" name="i_login_issues" required>&nbsp;<label for="i_login_issues_other">Other</label>
                </form>
              </div>
            </div>
          </span>

          <span name="step_3_1_1_reset_pwd_email_name" style="display:none;">
            <div class="tablerow">
              <div class="tablecell">
                <label for="i_reset_pwd_email">Email Address used for Login or Login ID</label>
              </div>
              <div class="tablecell">
                <input id="i_reset_pwd_email" type="email" placeholder="Login Email Address *" required>
              </div>
            </div>
            <div class="tablerow">
              <div class="tablecell">
                <label for="i_reset_pwd_full_name">Full Name</label>
              </div>
              <div class="tablecell">
                <input id="i_reset_pwd_full_name" type="textbox" placeholder="Full Name *" required>
              </div>
            </div>
          </span>

          <span name="step_3_1_2_change_email_name" style="display:none;">
            <div class="tablerow">
              <div class="tablecell">
                <label for="i_old_email">Old Email Address used for Login or Login ID</label>
              </div>
              <div class="tablecell">
                <input id="i_old_email" type="email" placeholder="Old Email Address *" required>
              </div>
            </div>
            <div class="tablerow">
              <div class="tablecell">
                <label for="i_old_full_name">Old Full Name</label>
                <div class="smallertext">Old name on account</div>
              </div>
              <div class="tablecell">
               <input id="i_old_full_name" type="textbox" placeholder="Old Full Name *" required >
             </div>
           </div>
           <div class="tablerow">
            <div class="tablecell">
              <label for="i_new_email">New Email Address used for Login or Login ID</label>
            </div>
            <div class="tablecell">
              <input id="i_new_email" type="email" placeholder="New Email Address *" required>
            </div>
          </div>
          <div class="tablerow">
            <div class="tablecell">
              <label for="i_new_full_name">New Full Name</label>
              <div class="smallertext">New/desired name on account</div>
            </div>
            <div class="tablecell">
             <input id="i_new_full_name" type="textbox" placeholder="New Full Name *" required >
           </div>
         </div>
       </span>

       <span name="step_3_1_3_cannot_login" style="display:none;">
        <div class="tablerow">
          <div class="tablecell">
            <label for="i_cannot_login_email">Email Address used for Login or Login ID</label>
          </div>
          <div class="tablecell">
            <input id="i_cannot_login_email" type="email" placeholder="Login Email Address *" required>
          </div>
        </div>
        <div class="tablerow">
          <div class="tablecell">
            <label for="i_cannot_login_full_name">Full Name</label>
          </div>
          <div class="tablecell">
            <input id="i_cannot_login_full_name" type="textbox" placeholder="Full Name *" required>
          </div>
        </div>
      </span>

      <span name="step_3_1_4_unable_to_view_courses" style="display:none;">
        <div class="tablerow">
          <div class="tablecell">
            <label for="i_course_view_login_email">Email Address used for Login or Login ID</label>
          </div>
          <div class="tablecell">
            <input id="i_course_view_login_email" type="email" placeholder="Login Email Address *" required>
          </div>
        </div>
        <div class="tablerow">
          <div class="tablecell">
            <label for="i_course_view_login_full_name">Full Name</label>
          </div>
          <div class="tablecell">
            <input id="i_course_view_login_full_name" type="textbox" placeholder="Full Name *" required>
          </div>
        </div>
      </span>

      <span name="step_3_1_5_other" style="display:none;">
        <div class="tablerow">
          <div class="tablecell">
            <label for="i_other_login_email">Email Address used for Login or Login ID</label>
          </div>
          <div class="tablecell">
            <input id="i_other_login_email" type="email" placeholder="Login Email Address *" required>
          </div>
        </div>
        <div class="tablerow">
          <div class="tablecell">
            <label for="i_other_login_full_name">Full Name</label>
          </div>
          <div class="tablecell">
            <input id="i_other_login_full_name" type="textbox" placeholder="Full Name *" required>
          </div>
        </div>
        <div class="tablerow" style="display:block;">
          <div class="tablecell" style="display:block;">
            <textarea id="i_other_description" type="textarea" placeholder="Any Description" style="width:100%;"></textarea>
          </div>
        </div>
      </span>
      
      <!-- Course Accounting Issues Drop down starts here -->
      <span name="step_3_2_course_accounting_issues" style="display:none;">
        <div class="tablerow" style="display:block;">
          <div class="tablecell">
            <label for="i_course_accounting_issues_hidden">Issue Type</label>
            <input type="hidden" id="i_course_accounting_issues_hidden" required>
          </div>
          <div class="tablecell">
            <form>
              <input type="radio" id="i_course_acct_issues_cancel" name="i_course_acct_issues" required>&nbsp;<label for="i_course_acct_issues_cancel">Cancel course after course completed</label>
              <br>
              <input type="radio" id="i_course_acct_issues_add_remove_teacher" name="i_course_acct_issues" required>&nbsp;<label for="i_course_acct_issues_add_remove_teacher" style="">Add/Remove Teacher/coordinator after course completed</label>
              <br>
              <input type="radio" id="i_course_acct_issues_reject_course_acct" name="i_course_acct_issues" required>&nbsp;<label for="i_course_acct_issues_reject_course_acct">Reject course accounting</label>
              <br>
              <input type="radio" id="i_course_acct_issues_course_transfer" name="i_course_acct_issues" required>&nbsp;<label for="i_course_acct_issues_course_transfer">Course transfer</label>
              <br>
              <input type="radio" id="i_course_acct_issues_course_refund" name="i_course_acct_issues" required>&nbsp;<label for="i_course_acct_issues_course_refund">Course refund</label>
              <br>
              <input type="radio" id="i_course_acct_issues_change_course_fee" name="i_course_acct_issues" required>&nbsp;<label for="i_course_acct_issues_change_course_fee">Change course fee</label>
              <br>
              <input type="radio" id="i_course_acct_issues_other" name="i_course_acct_issues" required>&nbsp;<label for="i_course_acct_issues_other">Other</label>
            </form>
          </div>
        </div>
      </span>

      <span name="step_3_2_1_cancel_course_after_complete" style="display:none;">
        <div class="tablerow">
          <div class="tablecell">
            <label for="i_coordinator_email">Coordinator Email Address</label>
          </div>
          <div class="tablecell">
            <input id="i_coordinator_email" type="email" placeholder="Coordinator Email Address *" required>
          </div>
        </div>
        <div class="tablerow">
          <div class="tablecell">
           <label for="i_coordinator_full_name">Coordinator Full Name</label>
         </div>
         <div class="tablecell">
           <input id="i_coordinator_full_name" type="textbox" placeholder="Coordinator Full Name *" required>
         </div>
       </div>
       <div class="tablerow">
        <div class="tablecell">
          <label for="i_course_id">Course ID</label>
        </div>
        <div class="tablecell">
          <input id="i_course_id" type="textbox" placeholder="Course ID *" required>
        </div>
      </div>
      <div class="tablerow">
        <div class="tablecell">
          <label for="i_course_type">Course type</label>
        </div>
        <div class="tablecell">
          <input id="i_course_type" type="textbox" placeholder="Course type *" required>
        </div>
      </div>
    </span>

        <span name="step_3_2_2_add_remove_teacher" style="display:none;">
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_program_org_email">Program Organizer Email Address</label>
            </div>
            <div class="tablecell">
              <input id="i_program_org_email" type="email" placeholder="Program Organizer Email Address *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_program_org_full_name">Program Organizer Full Name</label>
            </div>
            <div class="tablecell">
              <input id="i_program_org_full_name" type="textbox" placeholder="Program Organizer Full Name *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_program_org_phone_no">Program Organizer Phone No.</label>
            </div>
            <div class="tablecell">
              <input id="i_program_org_phone_no" type="textbox" placeholder="Program Organizer Phone No *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_program_org_full_name">Program Organizer Full Name</label>
            </div>
            <div class="tablecell">
              <input id="i_program_org_full_name" type="textbox" placeholder="Program Organizer Full Name *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_teacher_email">Teacher Email Address</label>
            </div>
            <div class="tablecell">
              <input id="i_teacher_email" type="email" placeholder="Teacher Email Address *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_teacher_full_name">Teacher full Name</label>
            </div>
            <div class="tablecell">
              <input id="i_teacher_full_name" type="textbox" placeholder="Teacher full Name *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;"> 
            <div class="tablecell">
              <label for="i_teacher_phone_no">Teacher Phone No</label>
            </div>
            <div class="tablecell">
              <input id="i_teacher_phone_no" type="textbox" placeholder="Teacher Phone No *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_course_id">Course ID</label>
            </div>
            <div class="tablecell">
              <input id="i_course_id" type="textbox" placeholder="Course ID *" required>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
              <label for="i_course_type">Course Type</label>
            </div>
            <div class="tablecell">
              <select id="i_course_type" required>
                <option value="Add">Add</option>
                <option value="Remove">Remove</option>                          
              </select>
            </div>
          </div>
          <div class="tablerow" style="display:block;">
            <div class="tablecell">
             <label for="i_role">Role</label>
           </div>
           <div class="tablecell">
            <select id="i_role" required>
              <option value="Program Organizer">Program Organizer</option>
              <option value="Teacher">Teacher</option>                          
            </select>
          </div>
        </div>
        <div class="tablerow" style="display:block;">
         <div class="tablecell">
          <label for="i_email_addres">Email Address</label>
        </div>
        <div class="tablecell">
          <input id="i_email_addres" type="email" placeholder="Email Address *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_same_full_name">Same full Name</label>
        </div>
        <div class="tablecell">
          <input id="i_same_full_name" type="textbox" placeholder="Same full Name *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_same_phone_no">Same Phone No</label>
        </div>
        <div class="tablecell">
          <input id="i_same_phone_no" type="textbox" placeholder="Same Phone No *" required>
        </div>
      </div>   
      </span>

      <span name="step_3_2_3_edit_submitted_course_acct" style="display:none;">
      <div class="tablerow">
        <div class="tablecell">
          <label for="i_program_org_email">Program Organizer Email Address</label>
        </div>
        <div class="tablecell">
          <input id="i_program_org_email" type="email" placeholder="Program Organizer Email Address *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_program_org_full_name">Program Organizer Full Name</label>
        </div>
        <div class="tablecell">
          <input id="i_program_org_full_name" type="textbox" placeholder="Program Organizer Full Name *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_program_org_phone_no">Program Organizer Phone No</label>
        </div>
        <div class="tablecell">
          <input id="i_program_org_phone_no" type="textbox" placeholder="Program Organizer Phone No *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_course_id">Course ID</label>
        </div>
        <div class="tablecell">
          <input id="i_course_id" type="textbox" placeholder="Course ID *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_course_type">Course Type</label>
        </div>
        <div class="tablecell">
          <select id="i_course_type" required>
            <option value="Add">Add</option>
            <option value="Remove">Remove</option>                          
          </select>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
       <div class="tablecell">
        <label for="i_teacher_email_addres">Teacher Email Address</label>
      </div>
      <div class="tablecell">
        <input id="i_teacher_email_addres" type="email" placeholder="Teacher Email Address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_teacher_full_name">Teacher full Name</label>
      </div>
      <div class="tablecell">
        <input id="i_teacher_full_name" type="textbox" placeholder="Teacher full Name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell">
        <label for="i_teacher_phone_no">Teacher Phone No</label>
      </div>
      <div class="tablecell">
        <input id="i_teacher_phone_no" type="textbox" placeholder="Teacher Phone No *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell">
        <label for="i_other_description">Describe why you want to edit the course accounting form below (200 words or less)</label>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell" style="display:block;">
        <textarea id="i_other_description" type="textarea" placeholder="Description" style="width:100%;"></textarea>
      </div>
      </div>
      </span>

      <span name="step_3_2_4_course_transfer" style="display:none;">
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="">FAQ page should come up</label>
        </div>
      </div>
      </span>

      <span name="step_3_2_5_course_refund" style="display:none;">
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="">FAQ page should come up</label>
        </div>
      </div>
      </span>

      <span name="step_3_2_6_course_change_fee" style="display:none;">
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="">Not to be coded</label>
        </div>
      </div>
      </span>

      <span name="step_3_2_7_other" style="display:none;">
      <div class="tablerow" style="display:block;">
       <div class="tablecell">
        <label for="i_email_addres">Email Address</label>
      </div>
      <div class="tablecell">
        <input id="i_email_addres" type="email" placeholder="Email Address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_full_name">Full Name</label>
      </div>
      <div class="tablecell">
        <input id="i_full_name" type="textbox" placeholder="Full Name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell">
        <label for="i_other_description">Describe your issue below (200 words or less)</label>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell" style="display:block;">
        <textarea id="i_other_description" type="textarea" placeholder="Description" style="width:100%;"></textarea>
      </div>
      </div>
      </span>

      <!-- General Course Issues -->
      <span name="step_3_3_general_course_issues" style="display:none;">
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_general_course_issues_hidden">Issue Type</label>
          <input type="hidden" id="i_general_course_issues_hidden" required>
        </div>
        <div class="tablecell">
          <form>
            <input type="radio" id="i_change_event_quick_reg" name="i_general_course_issues" required>&nbsp;<label for="i_change_event_quick_reg">Change Event to Quick Registration</label>
            <br>
            <input type="radio" id="i_course_not_visible" name="i_general_course_issues" required>&nbsp;<label for="i_course_not_visible">Course not visible on website</label>
            <br>
            <input type="radio" id="i_hidden_courses_events" name="i_general_course_issues" required>&nbsp;<label for="i_hidden_courses_events">Link for hidden courses and events</label>
            <br>
            <input type="radio" id="i_other" name="i_general_course_issues" required>&nbsp;<label for="i_other">Other</label>
            <br>
          </form>
        </div>
      </div>
      </span>

      <span name="step_3_3_1_change_event_quick_reg" style="display:none;">
      <div class="tablerow" style="display:block;">
       <div class="tablecell">
        <label for="i_pgm_org_email_addres">Program Organizer Email Address</label>
      </div>
      <div class="tablecell">
        <input id="i_pgm_org_email_addres" type="email" placeholder="Program Organizer Email Address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_pgm_org_full_name">Program Organizer Full Name</label>
      </div>
      <div class="tablecell">
        <input id="i_pgm_org_full_name" type="textbox" placeholder="Program Organizer Full Name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell">
        <label for="i_event_id">Event ID</label>
      </div>
      <div class="tablecell">
        <input id="i_event_id" type="textbox" placeholder="Event ID *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell">
        <label for="i_event_type">Event Type</label>
      </div>
      <div class="tablecell">
        <input id="i_event_type" type="textbox" placeholder="Event Type *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell">
        <label for="i_other_description">Describe why the registration should be a quick registration below (200 words or less)</label>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell" style="display:block;">
        <textarea id="i_other_description" type="textarea" placeholder="Description" style="width:100%;"></textarea>
      </div>
      </div>
      </span>

      <span name="step_3_3_2_course_not_visible" style="display:none;">
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="">‘Course not visible on website’, then a FAQ page</label>
        </div>
      </div>
      </span>

      <span name="step_3_3_3_link_for_hidden_courses" style="display:none;">
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="">‘Course not visible on website’, then a FAQ page</label>
        </div>
      </div>
      </span>

      <span name="step_3_3_4_other" style="display:none;">
      <div class="tablerow" style="display:block;">
       <div class="tablecell">
        <label for="i_email_addres">Email Address</label>
      </div>
      <div class="tablecell">
        <input id="i_email_addres" type="email" placeholder="Program Organizer Email Address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_full_name">Full Name</label>
      </div>
      <div class="tablecell">
        <input id="i_full_name" type="textbox" placeholder="Full Name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell">
        <label for="i_other_description">Describe your issue below (200 words or less)</label>
      </div>
      </div>
      <div class="tablerow" style="display:block;">
      <div class="tablecell" style="display:block;">
        <textarea id="i_other_description" type="textarea" placeholder="Description" style="width:100%;"></textarea>
      </div>
      </div>
      </span>

      <!-- Request Admin access -->
      <span name="step_3_4_request_admin_access" style="display:none;">
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_completed_vt">Have you completed Volunteer Training Program or TTC:</label>
          <div class="smallertext">(Previously known as Pre-TTC)</div>
        </div>
        <div class="tablecell">
          <form>
            <input type="radio" id="i_completed_volunteer_train_yes" name="i_completed_volunteer_train" required>&nbsp;<label for="i_completed_volunteer_train_yes">Yes, completed Volunteer Training (Pre-TTC)/TTC</label>
            <br>
            <input type="radio" id="i_completed_volunteer_train_no" name="i_completed_volunteer_train" required>&nbsp;<label for="i_completed_volunteer_train_no">No, have not completed Volunteer Training (Pre-TTC)</label>
            <br>
          </form>
        </div>
      </div>
      </span>

      <span name="step_3_4_1_completed_vol_train_yes" style="display:none;">
      <div class="tablerow" style="display:block;">
       <div class="tablecell">
        <label for="i_aol_email_addres">Art of Living Email Address</label>
      </div>
      <div class="tablecell">
        <input id="i_aol_email_addres" type="email" placeholder="Art of Living Email Address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_full_name">Full Name</label>
      </div>
      <div class="tablecell">
        <input id="i_full_name" type="textbox" placeholder="Full Name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_phone_no">Phone No</label>
      </div>
      <div class="tablecell">
        <input id="i_phone_no" type="textbox" placeholder="Phone No *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_rec_teacher_name">Recommending teacher name</label>
      </div>
      <div class="tablecell">
        <input id="i_rec_teacher_name" type="textbox" placeholder="Recommending teacher name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_rec_teacher_email">Recommending teacher email address</label>
      </div>
      <div class="tablecell">
        <input id="i_rec_teacher_email" type="email" placeholder="Email address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_recc_phone_no">Phone No</label>
      </div>
      <div class="tablecell">
        <input id="i_recc_phone_no" type="textbox" placeholder="Phone No *" required>
      </div>
      </div>
      </span>

      <span name="step_3_4_2_completed_vol_train_no" style="display:none;">
      <div class="tablerow" style="display:block;">
       <div class="tablecell">
        <label for="i_aol_email_addres">Your Art of Living Email Address</label>
      </div>
      <div class="tablecell">
        <input id="i_aol_email_addres" type="email" placeholder="Art of Living Email Address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_full_name">Full Name</label>
      </div>
      <div class="tablecell">
        <input id="i_full_name" type="textbox" placeholder="Full Name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_phone_no">Phone No</label>
      </div>
      <div class="tablecell">
        <input id="i_phone_no" type="textbox" placeholder="Phone No *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_first_rec_teacher_name">First Recommending teacher name</label>
      </div>
      <div class="tablecell">
        <input id="i_first_rec_teacher_name" type="textbox" placeholder="Recommending teacher name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_first_rec_teacher_email">First Recommending teacher email address</label>
      </div>
      <div class="tablecell">
        <input id="i_first_rec_teacher_email" type="email" placeholder="Email address *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_second_rec_teacher_name">Second Recommending teacher name</label>
      </div>
      <div class="tablecell">
        <input id="i_second_rec_teacher_name" type="textbox" placeholder="Recommending teacher name *" required>
      </div>
      </div>
      <div class="tablerow" style="display:block;">    
      <div class="tablecell">
        <label for="i_second_rec_teacher_email">Second Recommending teacher email address</label>
      </div>
      <div class="tablecell">
        <input id="i_second_rec_teacher_email" type="email" placeholder="Email address *" required>
      </div>
      </div>
      </span>

      <!-- Other -->
      <span name="step_3_5_other" style="display:none;">
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_email_address">Email address</label>
        </div>
        <div class="tablecell">
          <input id="i_email_address" type="email" placeholder="Email address *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_full_name">Full Name</label>
        </div>
        <div class="tablecell">
          <input id="i_full_name" type="textbox" placeholder="Full Name *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_other_description">Describe your issue below (200 words or less)</label>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell" style="display:block;">
          <textarea id="i_other_description" type="textarea" placeholder="Description" style="width:100%;"></textarea>
        </div>
      </div>
      </span>

      <!-- <span name="step_3_email_lnk_results" style="display:none;">
        <div class="tablerow" style="display:block;">
          <div class="tablecell">
            <form>
              <input type="email" id="i_name_of_applicant" name="i_name_of_applicant" required>&nbsp;<label for="i_name_of_applicant">Name Of Applicant:</label>
              <br>
              <input type="textbox" id="i_aol_email_of_appl" name="i_aol_email_of_appl" required>&nbsp;<label for="i_aol_email_of_appl">Art Of Living Email Of Applicant:</label>
              <br>
              <input type="textbox" id="i_tel_phone_no_of_appl" name="i_tel_phone_no_of_appl" required>&nbsp;<label for="i_tel_phone_no_of_appl">Telephone Number Of Applicant</label>
              <br>
              <input type="textbox" id="i_why_does_appl_need_access" name="i_why_does_appl_need_access" required>&nbsp;<label for="i_why_does_appl_need_access">Why does the applicant need access?</label>
              <br>
              <input type="textbox" id="i_apprx_how_many_courses_org" name="i_apprx_how_many_courses_org" required>&nbsp;<label for="i_apprx_how_many_courses_org">Approximately how many courses has he/she organized or co-ordinated?</label>
              <br>
              <input type="textbox" id="i_has_the_person_trained" name="i_has_the_person_trained" required>&nbsp;<label for="i_has_the_person_trained">Has this person been completely trained in course accounting so that they are able to handle the course finances from begining to end?</label>
              <br>
              <input type="textbox" id="i_state_where_the_user_belongs_to" name="i_state_where_the_user_belongs_to" required>&nbsp;<label for="i_state_where_the_user_belongs_to">State where the user belongs to</label>
              <br>
              <input type="textbox" id="i_name_of_the_cert_teacher" name="i_name_of_the_cert_teacher" required>&nbsp;<label for="i_name_of_the_cert_teacher">Name Of Certifying Teacher:</label>
              <br>
              <input type="email" id="i_email_of_the_cert_teacher" name="i_email_of_the_cert_teacher" required>&nbsp;<label for="i_email_of_the_cert_teacher">Email Of Certifying Teacher:</label>
            </form>
          </div>
        </div>
      </span> -->

      <!-- IAHV -->
      <span name="step_3_iahv" style="display:none;">
        <div class="tablerow" style="display:block;">
          <div class="tablecell">
           <label for="i_req_cat_hidden">Request category</label>
           <input type="hidden" id="i_req_cat_hidden" required>
         </div>
         <div class="tablecell">
          <form>
            <input type="radio" id="i_iahv_request_admin_access" name="i_iahv_choice" required>&nbsp;<label for="i_iahv_request_admin_access">Request Admin/Program Organizer access</label>
            <br>
            <input type="radio" id="i_iahv_other" name="i_iahv_choice" required>&nbsp;<label for="i_iahv_other">Other</label>
          </form>
        </div>
      </div>
      </span>

      <span name="step_3_1_iahv_request_admin_access" style="display:none;">
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_iahv_email">IAHV Email address</label>
        </div>
        <div class="tablecell">
          <input id="i_iahv_email" type="email" placeholder="IAHV Email address *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_full_name">Full Name</label>
        </div>
        <div class="tablecell">
          <input id="i_full_name" type="textbox" placeholder="Full Name *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <div>State where you will be organizing courses and events</div> 
          <label for="i_rec_teacher_name">Recommending teacher name</label>
        </div>
        <div class="tablecell">
          <input id="i_rec_teacher_name" type="textbox" placeholder="Recommending teacher Name *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_rec_teacher_email">Recommending teacher Email address</label>
        </div>
        <div class="tablecell">
          <input id="i_rec_teacher_email" type="email" placeholder="Teacher Email address *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_phone_no">Phone No</label>
        </div>
        <div class="tablecell">
          <input id="i_phone_no" type="textbox" placeholder="Phone No *" required>
        </div>
      </div>
      </span>

      <span name="step_3_2_iahv_other" style="display:none;">
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_iahv_email">Email address</label>
        </div>
        <div class="tablecell">
          <input id="i_iahv_email" type="email" placeholder="Email address *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">    
        <div class="tablecell">
          <label for="i_full_name">Full Name</label>
        </div>
        <div class="tablecell">
          <input id="i_full_name" type="textbox" placeholder="Full Name *" required>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell">
          <label for="i_other_description">Describe your issue below (200 words or less)</label>
        </div>
      </div>
      <div class="tablerow" style="display:block;">
        <div class="tablecell" style="display:block;">
          <textarea id="i_other_description" type="textarea" placeholder="Description" style="width:100%;"></textarea>
        </div>
      </div>      
      </span>

       <!--
          SAMPLE INPUTS
          Here we have inputs for first name, last name, email and additional inputs.
          NOTES:
          - email input is of type = email, that way validation is provided against email fields 
          - Additional details is a sample textarea input
        -->

      <!-- 
      BUTTON/SUBMIT SECTION
      This section is to be left unchanged, unless additional buttons are required.
      NOTES:
      - The ids of the buttons here are not to be changed
      - The onlick for edit and submit buttons should also not be changed
      -->
      <div id="step_submit" class="tablebody">
      <div class="tablerow">
        <div class="tablecell">
          <input id="btn_submit" type="button" class="c2a" value="Submit" onclick="submitTicket()" />
          <input id="btn_edit" type="button" class="btn-misc" value="Edit" style="display:none;" onclick="editTicket()" />
        </div>
      </div>
      </div>

