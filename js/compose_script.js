var recipients = [];

/* ON LOAD */
window.onload = function() {
	console.log("COMPOSE LOADING");
	if(meta('uid')!='') {
		get_reply_data(function(subjText) {
			if(subjText) {
				if(subjText.length > 30) {
					subjText = subjText.substring(0, 30 + "...");
				}
			}
			showHideScrollArrows();



			var header = "Inbox";
	        if(document.referrer.indexOf("drafts") > -1) {
	            header = "Drafts";
	        }
	        if(subjText) {
	            header += " > " + subjText;
	        }
	        else {
	            header += " > Read Message";
	        }
	        $('#pathHeader').text(header);
		});
	}
	else {
		$('#pathHeader').text('Compose');
	}
    
}
function get_reply_data(callback) {   
    make_request('http://localhost:8080/getemail/' + meta('uid'), function(e) {
        if (this.status == 200) {    
            var content = this.responseText;
            var data = JSON.parse(content);

            $("#from").html();
            $('#to').html(data[0].from);
            $("#subjectText").html("Re: " + data[0].subject);
           //TODO get plain text, put in box	
           //$("#write").html(data[0].text);

			callback(data[0].subject);
        } else {
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
        console.log("Message" + $(inboxmsg).attr('uid') + " deleted");
    }); 
    //window.location.href = document.referrer;

}


function sendMail(msg){
    var request = new XMLHttpRequest();
    url = 'http://localhost:8080/sendmail';
    request.open('POST', url, true);
   	request.setRequestHeader('Content-Type', "application/json"); 
   	console.log("sending messages");
    request.send(JSON.stringify({
    	"fromText": document.getElementById("fromText").value, 
    	"toText": document.getElementById("toText").value,
    	"subjectText": document.getElementById("subjectText").value,
    	"bodyTexts": document.getElementById("write").value
    }));
    window.location.href = "http://localhost:8080/inbox";
    //return request;
}

function saveDraft(msg){
	//TODO
	//AUTOSAVE AND DRAFT STUFF
}

/* recipients obj */
function Recipient(nickname, email) {
	this.nickname = nickname;
	this.email = email;
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
	console.log('toggling: '+thisRecipient.email);

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
		recipString += recipients[j].nickname;
		if(j!=recipients.length-1) {
			recipString += ", ";
		}
	}
	$('#toText').text(recipString);
	//TODO resize if there is overflow
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

//TODO cycling through recipients
function cycleRecipients(dir) {
    if(dir === 0) {
        // see prev 4
    }
    else if(dir === 1) {
        // see next 4
    }
}
