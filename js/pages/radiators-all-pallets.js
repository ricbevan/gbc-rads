getStarted();
var html = '';
var maxPalletNumber = 0;

document.addEventListener("DOMContentLoaded", function() {
	getPallets();
	
	gbc('#add-pallets').on('click', function() {
		addPallets();
	});
});

function getPallets() {
	
	let query = ' { boards (ids: ' + boardId_RadiatorPallet + ') { items_page(limit: 500, query_params: { order_by: { column_id:"name", direction:desc } }) { items { id name } } } } ';
	
	mondayAPI2(query, function(data) {
		
		let pallets = data['data']['boards'][0]['items_page']['items'];
		
		// sort pallets by pallet number
		pallets.sort((a, b) => (parseInt(a.name) < parseInt(b.name)) ? 1 : -1);
		
		var html = '<option value=\"\" disabled hidden selected>Pallet</option>';
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			
			let palletId = pallet.id;
			let palletName = pallet.name;
			
			if (palletName != "0") {
				html += '<option value="' + palletId + '">Pallet ' + palletName + '</option>';
				maxPalletNumber = (parseInt(maxPalletNumber) < parseInt(palletName) ? parseInt(palletName) : maxPalletNumber); // get max radiator number
			}
		}
		
		gbc('#pallet-number').html(html);
		
		gbc('#pallet-number').on('change', function(e) {
			getPallet();
		});
		
	});
}

function getPallet() {
	
	let palletId = gbc('#pallet-number').val();
	
	let query = ' { boards(ids: ' + boardId_RadiatorPallet + ') { items_page(limit: 500, query_params: { ids: [' + palletId + '] }) { items { column_values(ids: ["' + columnId_RadiatorPallet_Status + '", "' + columnId_RadiatorPallet_Radiators + '", "connect_boards"]) { id text value } } } } } ';
	
	mondayAPI2(query, function(data) {
		
		html = '';
		
		let pallet = data['data']['boards'][0]['items_page']['items'][0];
		
		let palletStatus = getColumnText(pallet, columnId_RadiatorPallet_Status);
		let palletRadiatorIds = getColumnValue(pallet, columnId_RadiatorPallet_Radiators);
		let palletDelivery = JSON.parse(getColumnValue(pallet, 'connect_boards'));
		
		html += '<p>';
		
		if (palletStatus == 'At GBC') {
			html += 'Currently at GBC.';
		} else {
			if ('linkedPulseIds' in palletDelivery) {
				palletDelivery = palletDelivery['linkedPulseIds'][0]['linkedPulseId'];
				
				html += 'Delivered.';
			}
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
			
			let query = ' { boards(ids:' + boardId_Radiator + ') { items_page(limit: 500, query_params: { ids: [' + radiatorIdArr.join(',') + '] }) { items { id name group { id title } column_values(ids: ["' + columnId_Radiator_Colour + '", "' + columnId_Radiator_PalletIncoming + '", "' + columnId_Radiator_ReceivedDate + '", "' + columnId_Radiator_PalletOutgoing + '", "' + columnId_Radiator_DispatchDate + '", "' + columnId_Radiator_Status + '"]) {  text id } } } } } ';
			
			mondayAPI2(query, function(data) {
				
				html += '<ul class="uk-list uk-list-striped">';
				
				let radiators = data['data']['boards'][0]['items_page']['items'];
				
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
					html += 'From purchase order: ' + fixDate(radiatorPurchaseOrder);
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