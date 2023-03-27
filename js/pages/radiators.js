document.addEventListener("DOMContentLoaded", function(){
	
	if(window.location.hash) {
		let hash = window.location.hash.substring(1);
		
		if (hash == 'clear') {
			localStorage.removeItem('User ID');
		}
		
		if (hash.includes("-")) {
			hash = hash.split("-");
			
			if (hash.length == 2) {
				setLocalStorage('Rads API Key', hash[0]);
				setLocalStorage('Rads User ID', hash[1]);
			}
		}
	}
	
	getStarted();
	
	gbc('#page').hide();
	
	if ((userId != '') && (userId != null) && (userId != undefined)) {
		gbc('#page').show();
	}
});