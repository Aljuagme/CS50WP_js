document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#compose-form').onsubmit = send_email;
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#content-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  show_emails(mailbox)
}

function send_email(event) {
  event.preventDefault();

  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  const recipients = document.querySelector('#compose-recipients').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        load_mailbox('sent')
      });
}


function show_emails(mailbox) {
  const url = `/emails/${mailbox}`;
  document.querySelector('#emails-view').innerHTML = '';
  document.querySelector('#content-view').innerHTML = '';

  fetch(url)
      .then(response => response.json())
      .then(data => {
        data.forEach(email => {
            let element = document.createElement('div');
            let e_mail;
            let archiveText = email.archived ? "Unarchive" : "Archive";
            if (mailbox === "sent") {
                e_mail = email.recipients;
            } else {
                e_mail = email.sender;
            }
            element.innerHTML = `
              <div class="email-container">
                <button class="archive-btn">${archiveText}</button>
                <div class="email-row">
                  <div class="email-sender"><strong>${e_mail}</strong></div>
                  <div class="email-body">${email.body}</div>
                  <div class="email-timestamp">${email.timestamp}</div>
                </div>
              </div>`;

            email.read ? element.classList.add("email-item") : element.classList.add("email-item", "notRead");

            element.querySelector('.email-row').addEventListener('click', () => {
                show_email(`${email.id}`)
            })

            element.querySelector('.archive-btn').addEventListener('click', () => {
                archive_email(email.id, email.archived)
            })
            document.getElementById('emails-view').append(element);

            console.log(email);
        });
      })
}

function show_email(id_email) {
    const url = `/emails/${id_email}`;
    document.querySelector('#emails-view').innerHTML = '';
    document.querySelector('#content-view').innerHTML = '';

    // Make a fetch request to the backend
    fetch(url)
        .then(response => response.json())
        .then(email => {
            // Access the returned data (emails)
            console.log(email); // For testing, logs the emails to the console
            let element = document.createElement('p');
            element.innerHTML = `<strong>From:</strong> ${email.sender}<br>
                                 <strong>To:</strong> ${email.recipients}<br>
                                 <strong>Subject:</strong> ${email.subject}<br>
                                 <strong>Timestamp:</strong> ${email.timestamp}
                                 <br>
                                 <button onclick="reply_email(${email.id})">Reply</button>
                                 <hr>`;
            document.getElementById('emails-view').append(element)

            let body_email = document.createElement('p');
            body_email.innerHTML = `${email.body}`;
            document.getElementById('content-view').append(body_email)

        })
        .catch(error => {
            // Handle any errors that occur during the fetch
            console.error('Error fetching emails:', error);
        });

    fetch(url, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to mark email as read')
        }
        console.log("Email marked as read")
    })
        .catch(error => {
            console.error("Error updating email status", error);
        })
}

function reply_email(email_id) {
    let id = parseInt(email_id);
    const url = `/emails/${id}`

    fetch(url)
        .then(response => response.json())
        .then(email => {
            console.log(email);
            compose_email();

            const subject = email.subject.startsWith("Re:") ? email.subject : "Re: " + email.subject;
            const body = email.timestamp + email.sender + ` wrote: ${email.body}\n\n`;
            document.getElementById('compose-recipients').value = email.sender;
            document.getElementById('compose-subject').value = subject;
            document.getElementById('compose-body').value = body;
        })
}

function archive_email(email_id, is_archived) {
    const url = `/emails/${email_id}`;

    fetch(url, {
        method: "PUT",
        body: JSON.stringify({
            archived: !is_archived
        })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Failed to archived email');
        }
        console.log("Email archived successfully");
        show_emails('inbox')
    }).catch(error => {
        console.error("Error updating archive status", error);
    })

}