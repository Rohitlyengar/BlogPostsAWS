document.addEventListener("DOMContentLoaded", function () {
    const postForm = document.getElementById("postForm");
    const postsContainer = document.getElementById("postsContainer");

    function loadPosts() {
        fetch("/posts")
            .then((response) => response.json())
            .then((data) => {
                postsContainer.innerHTML = "";
                data.forEach(post => {
                    const postElement = document.createElement("div");
                    postElement.classList.add("post");
                    postElement.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        <small><i>Posted on ${post.created_at}</i></small>
                        <hr>
                    `;
                    postsContainer.appendChild(postElement);
                });
            })
            .catch((error) => console.error("Error fetching posts:", error));
    }

    postForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const formData = new FormData(postForm);

        fetch("/posts", {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then(() => {
                postForm.reset();
                loadPosts(); // Refresh posts
            })
            .catch((error) => console.error("Error adding post:", error));
    });

    loadPosts();
});