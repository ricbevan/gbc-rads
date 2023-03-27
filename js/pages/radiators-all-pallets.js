getStarted();
var html = '';

document.addEventListener("DOMContentLoaded", function() {
	getPallets();
	
	gbc('#add-pallets').on('click', function() {
		addPallets();
	});
});

function getPallets() {
	
	let query = ' { boards (ids: ' + boardId_RadiatorPallet + ') { items { id name column_values(ids:["' + columnId_RadiatorPallet_Status + '"]) { id text } } } } ';
	
	mondayAPI(query, function(data) {
		
		let pallets = data['data']['boards'][0]['items'];
		
		// sort pallets by pallet number
		pallets.sort((a, b) => (parseInt(a.name) < parseInt(b.name)) ? 1 : -1);
		
		var html = '<option value=\"\" disabled hidden selected>Pallet</option>';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			
			let palletId = pallet.id;
			let palletName = pallet.name;
			let palletStatus = getColumnText(pallet, columnId_RadiatorPallet_Status);
			
			if (palletName != "0") {
				html += '<option value="' + palletId + '">Pallet ' + palletName + ' [' + palletStatus + ']</option>';
			}
		}
		
		gbc('#pallet-number').html(html);
		
		gbc('#pallet-number').on('change', function(e) {
			getPallet();
		});
		
		getHashPallet();
		
	});
}

function getPallet() {
	
	let palletId = gbc('#pallet-number').val();
	
	let query = ' { boards(ids: ' + boardId_RadiatorPallet + ') { items(ids: ' + palletId + ') { column_values(ids: ["' + columnId_RadiatorPallet_DispatchedDate + '", "' + columnId_RadiatorPallet_Status + '", "' + columnId_RadiatorPallet_DeliveredBy + '", "' + columnId_RadiatorPallet_Radiators + '"]) { id text value } } } } ';
	
	mondayAPI(query, function(data) {
		
		html = '';
		
		let pallet = data['data']['boards'][0]['items'][0];
		
		let palletDate = getColumnText(pallet, columnId_RadiatorPallet_DispatchedDate);
		let palletStatus = getColumnText(pallet, columnId_RadiatorPallet_Status);
		let palletDeliveredBy = getColumnText(pallet, columnId_RadiatorPallet_DeliveredBy);
		let palletRadiatorIds = getColumnValue(pallet, columnId_RadiatorPallet_Radiators);
		
		html += '<p>';
		
		if (palletStatus == 'At GBC') {
			html += 'Currently at GBC.';
		} else {
			html += 'Delivered by ' + fixName(palletDeliveredBy) + ' on ' + fixDate(palletDate);
		}
		
		html += '</p>';
		
		gbc('#page').show().html(html);
		
		getRadiatorsOnPallets(palletRadiatorIds);
		
	});
}

function getRadiatorsOnPallets(palletRadiatorIds) {
	
	if (palletRadiatorIds != null) {
		var radiatorIds = JSON.parse(palletRadiatorIds);
		
		if ('linkedPulseIds' in radiatorIds) {
		
			radiatorIds = radiatorIds['linkedPulseIds'];
			
			radiatorIdArr = [];
			
			for (var i = 0; i < radiatorIds.length; i++) {
				let radiatorId = radiatorIds[i];
				
				radiatorIdArr.push(radiatorId['linkedPulseId']);
			}
			
			let query = ' { boards(ids:' + boardId_Radiator + ') { items(ids: [' + radiatorIdArr.join(',') + ']) { id name group { id title } column_values(ids: ["' + columnId_Radiator_Colour + '", "' + columnId_Radiator_PalletIncoming + '", "' + columnId_Radiator_ReceivedDate + '", "' + columnId_Radiator_PalletOutgoing + '", "' + columnId_Radiator_DispatchDate + '", "' + columnId_Radiator_Status + '"]) {  text id } } } } ';
			
			mondayAPI(query, function(data) {
				
				html += '<ul class="uk-list uk-list-striped">';
				
				let radiators = data['data']['boards'][0]['items'];
				
				radiators.sort((a, b) => (
					(getColumnText(a, columnId_Radiator_Colour) + a.name) > 
					(getColumnText(b, columnId_Radiator_Colour) + b.name)) ? 1 : -1);
				
				for (var i = 0; i < radiators.length; i++) {
					let radiator = radiators[i];
					
					let radiatorId = radiator.id;
					let radiatorCode = radiator.name;
					let radiatorColour = getColumnText(radiator, columnId_Radiator_Colour);
					let radiatorReceivedPallet = getColumnText(radiator,columnId_Radiator_PalletIncoming );
					let radiatorReceivedDate = getColumnText(radiator, columnId_Radiator_ReceivedDate);
					let radiatorDispatchPallet = getColumnText(radiator, columnId_Radiator_PalletOutgoing);
					let radiatorDispatchDate = getColumnText(radiator, columnId_Radiator_DispatchDate);
					let radiatorStatus = getColumnText(radiator, columnId_Radiator_Status);
					let radiatorPurchaseId = radiator.group.id;
					let radiatorPurchaseOrder = radiator.group.title;
					
					html += '<li class="uk-flex uk-flex-middle">';
					html += '<p class="uk-flex-1 uk-margin-remove-bottom">';
					html += '<span class="uk-text-bold">';
					html += '[' + radiatorColour + '] ';
					html += radiatorCode;
					html += '</span>';
					html += '<br />'
					html += '<span class="uk-text-light uk-text-small">';
					html += 'From purchase order: <a href="radiators-all-orders.html#' + radiatorPurchaseId + '">' + fixDate(radiatorPurchaseOrder) + '</a>';
					html += '</span>';
					html += '<br />';
					html += '<span class="uk-text-light uk-text-small">';
					
					if (radiatorStatus == "Not Received") {
						html += 'Not received yet';
					} else {
						html += 'Received on pallet ' + radiatorReceivedPallet + ', on ' + fixDate(radiatorReceivedDate) + '.';
					}
					
					html += '</span>';
					html += '</p>';
					html += '<span uk-icon="icon: info;" class="uk-flex-none" uk-tooltip="title: ' + radiatorId + '; pos: left"></span>'
					
					html += '</li>';
				}
				
				html += '</ul>';
				
				gbc('#page').show().html(html);
				
			});
		}
	}
}

function getHashPallet() {
	if(window.location.hash) {
		let hash = window.location.hash.substring(1);
		
		gbc('#pallet-number').val(hash);
		getPallet();
	}
}