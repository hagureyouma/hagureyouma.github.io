const modal = $('#modal-container');
const img = modal.find('img');
$('img.popup').each(function(index) {
	$(this).click(function() {
		img.attr('src', $(this).attr('src'));
		modal.show();
	})
});
modal.click(function() {
	$(this).hide();
});