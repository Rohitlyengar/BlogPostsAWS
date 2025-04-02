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
        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;

        fetch("/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content }),
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
