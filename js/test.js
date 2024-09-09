const modal = document.getElementById('modal-container');

const imgframe = modal.querySelector(img);
document.querySelectorAll('.popup img').forEach(function (elem) {
    elem.addEventListener('click', () => {
        imgframe.src = elem.src;
        modal.style.display = 'block';
    })
});

modal.addEventListener('click', () => modal.style.display = 'none');