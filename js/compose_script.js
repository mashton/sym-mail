var recipients = [];

/* on load */
$(window).load(function() {
    // IF WRITING REPLY
	if(meta('uid').length > 0) {
        // loading screen
        $('#loadingScreen').fadeIn(0);

		get_reply_data(function(subjText) {
			if(subjText && subjText.length > 30) {
				subjText = subjText.substring(0, 30 + "...");
			}
			var header = "Inbox > ";
	        if(document.referrer.indexOf("drafts") > -1) {
	            header = "Drafts > ";
	        }
	        if(subjText) {
	            header += subjText;
	        }
	        else {
	            header += "Read Message";
	        }
	        header += " > Reply";
	        $('#pathHeader').text(header);

            $('#loadingScreen').fadeOut(300);
	        showHideScrollArrows();
            // turn on cycling once everything has loaded
            cyclingOn(1);
		});
	}
    // ELSE IF REGULAR COMPOSE
	else {
        cyclingOn(1);
		$('#pathHeader').text('Compose');
	}


    $("#write").on('change keyup paste', function() {
        showHideScrollArrows();
    });

    $("#toTextArea").on('change keyup paste', function() {
        $(this).height(this.scrollHeight);

    });

    $("#subjectText").on('change keyup paste', function() {
        $(this).height(this.scrollHeight);

    });

});





function get_reply_data(callback) {   
    make_request('http://localhost:8080/getemail/' + meta('boxname')+'/'+meta('uid'), function(e) {
        if (this.status == 200) {    
			var content = this.responseText;
			var data = JSON.parse(content);

			$("#from").html();

			$("#toTextArea").html(data[0].from.address);

			recipients.push(new Recipient(data[0].from.name, data[0].from.address));
			$("#subjectText").html("Re: " + data[0].subject);

   			$("#replyText").html(data[0].body);

			var plainText = jQuery('<div>').html(data[0].body).text();

			$('#write').val('\n\n\n-----\n'+plainText);
			$('#write').selectRange(0);
			callback(data[0].subject);
        }
        else {
            alert("Feed Request was invalid.");
        }               
    });
}


// when window is resized, check again if you need arrows
$(window).bind('resize', function() {
    showHideScrollArrows();
});


function submitEmail() {
	var mainform = document.getElementById('mainform');
	mainform.submit();
}

function deleteMessage(inboxmsg) {
    make_request('http://localhost:8080/delete/' + $(inboxmsg).attr('uid'), function(e) {
        window.location.href = 'http://localhost:8080/';
    }); 

}

function saveDraft(msg){
	var request = new XMLHttpRequest();
    console.log("saving");
    url = 'http://localhost:8080/save';
    request.open('POST', url, true);
   	request.setRequestHeader('Content-Type', "application/json"); 
   	var emailString = '';
   	recipients.forEach(function(x){
   		emailString += x.email + ','; 
   	});
   	emailString = emailString.slice(0,-1);
    request.send(JSON.stringify({
    	"toText": emailString,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyText": document.getElementById("write").value
    }));
    //window.location.href = "http://localhost:8080/inbox";
}


function sendMail(msg){
    var request = new XMLHttpRequest();
    url = 'http://localhost:8080/sendmail';
    request.open('POST', url, true);
   	request.setRequestHeader('Content-Type', "application/json"); 
   	var emailString = '';
   	recipients.forEach(function(x){
   		emailString += x.email + ','; 
   	});
   	emailString = emailString.slice(0,-1);
    request.send(JSON.stringify({
    	"toText": emailString,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyText": document.getElementById("write").value
    }));
    window.location.href = "http://localhost:8080/inbox";
}


/* recipients obj */
function Recipient(nickname, email) {
	this.nickname = nickname;
	this.email = email;
}
var pageNumber;
function expandToSelection(num){
	pageNumber = num; //this is what page you are on


    $('#recipientBoxRow').removeClass('hide');
    // remove hide from all descendants
    $('#recipientBoxRow').find('.hide').removeClass('hide');

	var offset = 0 + parseInt(pageNumber);
	url = 'http://localhost:8080/addressBook/' + offset; 
    make_request(url, function(e) {
    	var content = this.responseText; 
		var abook = JSON.parse(content); 
		abook = abook['contacts'];
		var count = 0; 
		var recipient = $( ".recipient" );
		if (abook.length<recipient.length){
			$(".recipient-container:last").addClass('hide');
			$(".email-address:last").addClass('hide');
			$('.seeNextRecip').addClass('hide');
		}
		for (var i = 0; i < recipient.length && i < abook.length; i++) {
			if (abook[i]['nickname'] != ""){
				recipient[i].innerHTML = abook[i]['nickname']; 
			} else {
				recipient[i].innerHTML = abook[i]['email']; 
			}

            // if in recipients list, make active
            for(var k in recipients) {
                if(recipients[k].email === abook[i]['email']) {
                    $(recipient[i]).addClass('active');
                }
            }
		};

		var emails = $( ".email-address" ); 
		for (var i = 0; i < emails.length && i < abook.length; i++) {
 			emails[i].innerHTML = abook[i]['email']; 
		};
    }); 

    

    if (pageNumber==0){
    	$('.seePrevRecip').addClass('hide'); //no prevs to start with
    }
    // set id to id of seePrevRecip
    var newID = $('.seePrevRecip').attr('id');
    newID = newID.substring(0, newID.length-1);
    id = newID;
    groupNumber = 0;
}

function goBackClicked() {
    // if recipients are visible, hide
    if(!$('#recipientBoxRow').hasClass('hide')) {
        $('#recipientBoxRow').addClass('hide');
    }
}

function toggleRecipient(obj) {
	var name = $(obj).text().trim();
	var addr = $(obj).parent().find('.email-address').text();
	// if no email address, name is email address
	if(addr === "") {
		addr = name;
	}
	var thisRecipient = new Recipient(name, addr);

	//ALREADY IN LIST
	if($(obj).find('.recipient').hasClass('active')) {
		$(obj).find('.recipient').removeClass('active');
		removeRecipient(thisRecipient.email);
	}
	else { //NOT ALREADY IN LIST
		$(obj).find('.recipient').addClass('active');
		recipients.push(thisRecipient);
	}

	// make recipients list into comma-separated string
	var recipString = "";
	for(var j = 0; j < recipients.length; j++) {
		recipString += recipients[j].email;
		if(j!=recipients.length-1) {
			recipString += ", ";
		}
	}
	$('#toTextArea').text(recipString);
	//$('#toTextArea').change(); 
}

function removeRecipient(email) {
	var indexToRemove = -1;
	for(var i in recipients) {
		if(recipients[i].email === email) {
			indexToRemove = i;
		}
	}
	if(indexToRemove != -1) {
		recipients.splice(indexToRemove, 1);
	} 
}

function cycleRecipients(dir) {
    if(dir === 0) {
        expandToSelection(pageNumber-1);
    }
    else if(dir === 1) {
		$('.seePrevRecip').removeClass('hide');
        expandToSelection(pageNumber+1);
    }
}


/**** KEYBOARD ****/

function expandKeyboard(textAreaID){
    if(textAreaID === "write") {
        $('.writeSubjectDiv').addClass('hide');
		$('.writeRecipientDiv').addClass('hide');
    }
    if(textAreaID === "subjectText" || textAreaID === "toTextArea") {
        $('.writeMessageDiv').addClass('hide');
    }

    if ($('#keyboardFrame').hasClass("hide") ){
        cyclingOn(0); // TURN OFF CYCLING
        $('#keyboardFrame').removeClass("hide");
        $('#keyboardFrame').attr('name', textAreaID); // tell keyboard where to type
        $('#keyboardFrame').attr('src', '/keyboard');
        document.getElementById("keyboardFrame").contentWindow.focus();
    }
}
function hideKeyboard() {

    if (!$('#keyboardFrame').hasClass("hide")){
        $('.writeMessageDiv').removeClass('hide');
        $('.writeSubjectDiv').removeClass('hide');
		$('.writeRecipientDiv').removeClass('hide');
        
        $('#keyboardFrame').addClass("hide");
        $('#keyboardFrame').removeAttr('name'); 
        $('#keyboardFrame').removeAttr('src');
        $('#keyboardFrame').click();
        cyclingOn(1); // TURN ON CYCLING
        $(window).focus();
    }
}

$.fn.selectRange = function(start, end) {
    if(!end) end = start; 
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};
