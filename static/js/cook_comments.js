document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.reply-icon').forEach(button => {
        button.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-review-id');
            const replyForm = document.getElementById(`reply-form-${reviewId}`);
            // Toggle display state
            replyForm.style.display = replyForm.style.display === 'block' ? 'none' : 'block';
        });
    });

    document.querySelectorAll('.send-reply-btn').forEach(button => {
        button.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-review-id');
            const replyInput = document.querySelector(`#reply-form-${reviewId} .reply-input`);
            const replyText = replyInput.value;

            fetch('/add_reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ review_id: reviewId, reply_text: replyText })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const replyForm = document.getElementById(`reply-form-${reviewId}`);
                    const replyIconContainer = document.getElementById(`reply-icon-container-${reviewId}`); // Directly get reply icon container

                    const newReply = document.createElement('div');
                    newReply.classList.add('reply-card');
                    newReply.innerHTML = `
                        <p class="reply-text"><strong>Chef Reply:</strong> ${data.reply.reply_text}</p>
                        <p class="reply-date"><small>${data.reply.created_at}</small></p>
                    `;
                    // Insert new reply above Reply icon
                    replyIconContainer.parentNode.insertBefore(newReply, replyIconContainer);

                    // Clear input box and hide reply box
                    replyInput.value = '';
                    replyForm.style.display = 'none';
                } else {
                    alert(data.message);
                }
            });
        });
    });
});
