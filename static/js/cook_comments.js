document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.reply-icon').forEach(button => {
        button.addEventListener('click', function() {
            const reviewId = this.getAttribute('data-review-id');
            const replyForm = document.getElementById(`reply-form-${reviewId}`);
            // 切换显示状态
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
                    const replyIconContainer = document.getElementById(`reply-icon-container-${reviewId}`); // 直接获取回复图标的容器

                    const newReply = document.createElement('div');
                    newReply.classList.add('reply-card');
                    newReply.innerHTML = `
                        <p class="reply-text"><strong>Chef Reply:</strong> ${data.reply.reply_text}</p>
                        <p class="reply-date"><small>${data.reply.created_at}</small></p>
                    `;
                    // 在 Reply 图标的上方插入新回复
                    replyIconContainer.parentNode.insertBefore(newReply, replyIconContainer);

                    // 清空输入框并隐藏回复框
                    replyInput.value = '';
                    replyForm.style.display = 'none';
                } else {
                    alert(data.message);
                }
            });
        });
    });
});
