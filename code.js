var parser = document.createElement("a");
parser.href = document.location.href;

if (parser.hostname === "scratch.mit.edu" && parser.pathname.startsWith("/projects/")) {
    var projectID = parser.pathname.replace(/\D/g, '');

    var script = document.createElement('script');
    script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
    script.type = 'text/javascript';
    script.onload = animThumbnailMain;
    document.getElementsByTagName('head')[0].appendChild(script);

} else {
    ScratchTools.modals.create({
        title: "Invalid Page",
        description: "Please use this tool on a Scratch project page.",
        components: []
    });
}

function animThumbnailMain() {

    getCookie = function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    };

    upload = function upload(filelocation) {

        var reader = new FileReader();

        reader.onload = function (e2) {
            $.ajax({
                type: "POST",
                url: "/internalapi/project/thumbnail/" + projectID + "/set/",
                data: e2.target.result,
                headers: {
                    "X-csrftoken": getCookie("scratchcsrftoken"),
                },
                contentType: "",
                processData: false,

                success: function () {
                    ScratchTools.modals.create({
                        title: "Success",
                        description: "Thumbnail updated successfully.",
                        components: []
                    });
                },

                error: function () {
                    ScratchTools.modals.create({
                        title: "Upload Failed",
                        description: "Could not update thumbnail.",
                        components: []
                    });
                }
            });
        };

        reader.readAsArrayBuffer(filelocation);
    };

    function useStage() {
        try {

            const canvas =
                document.querySelector("canvas[width='720'][height='540']") ||
                document.querySelector("canvas");

            if (!canvas) {
                ScratchTools.modals.create({
                    title: "Error",
                    description: "Scratch stage not found.",
                    components: []
                });
                return;
            }

            function uploadBlob(blob) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    $.ajax({
                        type: "POST",
                        url: "/internalapi/project/thumbnail/" + projectID + "/set/",
                        data: e.target.result,
                        headers: {
                            "X-csrftoken": getCookie("scratchcsrftoken"),
                        },
                        contentType: "",
                        processData: false,

                        success: function () {
                            ScratchTools.modals.create({
                                title: "Stage Thumbnail Set",
                                description: "Thumbnail updated from stage successfully.",
                                components: []
                            });
                        },

                        error: function () {
                            ScratchTools.modals.create({
                                title: "Upload Failed",
                                description: "Could not upload stage thumbnail.",
                                components: []
                            });
                        }
                    });
                };

                reader.readAsArrayBuffer(blob);
            }

            if (canvas.toBlob) {
                canvas.toBlob(function (blob) {
                    if (blob) uploadBlob(blob);
                    else fallback();
                }, "image/png");
            } else {
                fallback();
            }

            function fallback() {
                try {
                    const dataURL = canvas.toDataURL("image/png");

                    fetch(dataURL)
                        .then(res => res.blob())
                        .then(uploadBlob)
                        .catch(() => {
                            ScratchTools.modals.create({
                                title: "Error",
                                description: "Failed to capture stage image.",
                                components: []
                            });
                        });

                } catch (err) {
                    ScratchTools.modals.create({
                        title: "Error",
                        description: "Stage capture failed.",
                        components: []
                    });
                }
            }

        } catch (err) {
            ScratchTools.modals.create({
                title: "Error",
                description: "Unexpected error while capturing stage.",
                components: []
            });
        }
    }

    function initFileInput() {
        if (!document.getElementById("uploadthumbnail")) {
            var file = document.createElement("input");
            file.id = "uploadthumbnail";
            file.type = "file";
            file.accept = "image/*";
            document.body.appendChild(file);

            file.onchange = function () {
                if (file.files[0]) upload(file.files[0]);
            };
        }
    }

    function addCustomThumbnailButton() {
        const originalBtn = document.querySelector('button[title="Set Thumbnail"]');

        if (!originalBtn || document.getElementById("custom-set-thumb-btn")) return;

        const btn = document.createElement("button");
        btn.id = "custom-set-thumb-btn";
        btn.className = originalBtn.className;
        btn.title = "Enhanced Thumbnail Tool";

        btn.innerHTML = `
            <div class="button_content_W+xEu">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMTZjNC40MTggMCA4LTMuNTgyIDgtOFMxMi40MTggMCA4IDAgMCAzLjU4MiAwIDhTMy41ODIgMTYgOCAxNloiIGZpbGw9IiM1NzVFNzUiLz4KPC9zdmc+"
                class="stage-header_stage-button-icon_tUZn7">
            </div>
        `;

        originalBtn.parentNode.insertBefore(btn, originalBtn.nextSibling);

        btn.onclick = function () {

            let uploadBtn = document.createElement("button");
            uploadBtn.textContent = "Upload Image";
            uploadBtn.style.width = "100%";
            uploadBtn.style.marginBottom = "8px";

            uploadBtn.onclick = function () {
                document.getElementById("uploadthumbnail").click();
            };

            let stageBtn = document.createElement("button");
            stageBtn.textContent = "Use Stage";
            stageBtn.style.width = "100%";

            stageBtn.onclick = function () {
                useStage();
            };

            let container = document.createElement("div");
            container.appendChild(uploadBtn);
            container.appendChild(stageBtn);

            ScratchTools.modals.create({
                title: "Set Thumbnail",
                description:
                    "Upload an image or capture the current stage as your project thumbnail.",
                components: [
                    {
                        type: "html",
                        content: container
                    }
                ]
            });
        };
    }

    initFileInput();
    addCustomThumbnailButton();
}
