/*
Copyright 2014 Matthew M Morrow
http://matthewmmorrow.com

This file is part of Cards Board extension for Chrome.
http://cardsboard.oneweekonewebsite.com

Cards Board is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

Cards Board is ALL RIGHTS RESERVED except card.js:

card.js is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version with the following exceptions:
You cannot use the cards.js to make a Chrome new tab replacement 
but you can use it to extend Cards Board or other purposes.

card.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with card.js.  If not, see <http://www.gnu.org/licenses/>.
*/

var cardsboard = (function (module) {
	module.nowExtensionId = 'cpofkpjfjccpjjfnbbjlmdakpegeicek';
	
	//Checks whether an extension is blacklisted
	module.isBlackListed = function(id){
		switch(id){
			case "blacklistedid":
				return true;
			default:
				return false;
		};
	};
	
	module.updateAddCard = module.updateAddCard || function(){};
	
	//Card
	module.emptyCard = "<article class='card'><style></style><section class='front'></section></article>";
	module.Card = function(cardType, extensionId, port){
		this.cardType = cardType;
		this.extensionId = extensionId
		this.card = $(module.emptyCard);
		this.front = this.card.find(".front");
		this.style = this.card.find("style");
		this.card.data("extensionId", extensionId);
		this.isLocal = (module.nowExtensionId == extensionId);
		this.position = 0;
		this.column = 1;
		
		this.port = port;
		if(port) {
			var card = this;
			this.isRemote = true;
			this.port.onMessage.addListener(function(msg){card.handleUpdate(msg);});
		} else {
			this.isRemote = false;
		}
	};
	module.Card.prototype.name = "Cards Board card";
	module.Card.prototype.description = "A card for Cards Board";
	module.Card.prototype.author = "Matthew Morrow";
	module.Card.prototype.setCardId = function(cardId){
		this.cardId = cardId;
		this.card.attr("id", cardId);
	};
	
	module.Card.prototype.setPosition = function(column, position){
		this.column = column;
		this.position = position;

		if(this.isRemote){
			this.sendCommand("setPosition");
		}
	};
	
	module.Card.prototype.getSaveData = function(){
		var data = {cardId:this.cardId, cardType:this.cardType, extensionId: this.extensionId, column: this.column, position: this.position};
		return data;
	};
	
	module.Card.prototype.setSaveData = function(data){
		this.cardId = data.cardId;
		this.cardType = data.cardType;
		this.extensionId = data.extensionId;
		this.column = data.column;
		this.position = data.position;
		if(this.isRemote)
			this.sendUpdate("updated");
	};
	
	//*********************
	//* Message Functions *
	//*********************
	
	module.Card.prototype.sendCommand = function(command){
		this.port.postMessage({command: command, extensionId: this.extensionId, cardType:this.cardType, cardId:this.cardId, column:this.column, position:this.position});
	};
	module.Card.prototype.handleUpdate = function(msg){
		switch(msg.command){
			case "created":
				this.updCreated(msg);
				break;
			case "updated":
				this.updUpdated(msg);
				break;
			default:
				//not found
				break;
		};
	};
	
	module.Card.prototype.register = function(){
		var card = this;
		this.port = chrome.runtime.connect(module.nowExtensionId);
		this.port.onMessage.addListener(function(msg){card.handleCommand(msg);});
		this.sendUpdate("registerCard");
	};
	
	module.Card.prototype.unregister = function(){
		this.sendUpdate("unregisterCard");
	};
	
	module.Card.prototype.updCreated = function(msg){
		this.front.html(msg.front);
		this.style.html(msg.style);
	};
	
	module.Card.prototype.updUpdated = function(msg){
		this.front.html(msg.front);
	};
	
	/*
		***Commands***
		register:
			{command,extensionId,cardType, cardId}
		update:
			{command,extensionId,cardType, cardId}
	*/
	
	
	module.Card.prototype.sendUpdate = function(command){
		if(!this.port)
			return;
			
		if(command == "created")
			this.port.postMessage({command: command, extensionId: this.extensionId, cardType:this.cardType, cardId:this.cardId, front: this.front.html(), style:this.style.html(), column:this.column, position:this.position });
		else
			this.port.postMessage({command: command, extensionId: this.extensionId, cardType:this.cardType, cardId:this.cardId, front: this.front.html(), style:null, column:this.column, position:this.position });
	};
	module.Card.prototype.handleCommand = function(msg){
		switch(msg.command){
			case "create":
				this.cmdCreate();
				break;
			case "update":
				this.cmdUpdate();
				break;
			case "delete":
				this.cmdDelete();
				break;
			case "setPosition":
				this.setPosition(msg.column, msg.position);
				if(module.extensions)
					module.extensions[this.extensionId].saveCards();
				break;
			default:
				//not found
				break;
		};
	};
	
	//Command functions
	module.Card.prototype.cmdCreate = function(){
		this.create();
		this.sendUpdate("created");
	};
	
	module.Card.prototype.cmdUpdate = function(){
		this.update();
		this.sendUpdate("updated");
	};
	
	module.Card.prototype.cmdDelete = function(){
		this.delete();
		this.sendUpdate("deleted");
		this.port.disconnect();
	};
	
	//Functions to override
	module.Card.prototype.create = function(){};
	module.Card.prototype.update = function(){};
	module.Card.prototype.delete = function(){};
	
	
	module.extensions = {};
	
	module.Extension = function(extensionId, port, details){
		this.extensionId = extensionId;
		module.extensions[extensionId] = this;
		this.isLocal = (extensionId == module.nowExtensionId);
		
		this.cards = {};
		this.cardTypes = {};
		
		//Port is included in client from register
		this.port = port;
		if(port) {
			var extension = this;
			this.port.onMessage.addListener(function(msg){extension.handleCommand(msg);});
			this.isRemote = true;
		} else {
			this.isRemote = false;
		}
		
		if(details){
			this.cardTypes = details.cardTypes;
		}
		
		this.loadCards();
	};
	module.Extension.prototype.name = "Cards Board extension";
	module.Extension.prototype.description = "An extension for Cards Board";
	module.Extension.prototype.author = "Matthew Morrow";
	module.Extension.prototype.getDetails = function() {
		var cardTypes = {};
		for(var cardType in this.cardTypes){
			cardTypes[cardType] = {name:this.cardTypes[cardType].prototype.name, description:this.cardTypes[cardType].prototype.description,author:this.cardTypes[cardType].prototype.author};
		}
		return {name:this.name,description:this.description,author:this.author,cardTypes:cardTypes};
	};
	
	//* Load/Save data Functions *
	/*
		Keyed on extension ID
		{extensionId:{cardId:{cardId,cardType,...},...}}
	*/
	module.Extension.prototype.saveCards = function(){
		var data = {};
		data[this.extensionId] = {};
		for(var cardId in this.cards){
			data[this.extensionId][cardId] = this.cards[cardId].getSaveData();
		}
		chrome.storage.local.set(data, function(){});
	};
	
	module.Extension.prototype.loadCards = function(){
		var extension = this;
		chrome.storage.local.get(this.extensionId, function(items){
			extension.savedata = {};
			var cards = (items[extension.extensionId] || {});
			var ccards = {};
			for(var cardId in cards){
				ccards[cardId] = cards[cardId].cardType;
				if(extension.cards[cardId])
					extension.cards[cardId].setSaveData(cards[cardId]);
				else
					extension.savedata[cardId] = cards[cardId];
			};
			if(extension.isRemote)
				extension.createCards(ccards);
		});
	};
	
	//* Message Functions *
	/*
		register:
			{command,extensionId, details}
		createCards:
			{command,extensionId, {cardId:cardType,...}}
	*/
	module.Extension.prototype.sendCommand = function(command, data){
		try{
			this.port.postMessage({command: command, extensionId: this.extensionId, data: data });
		} catch (ex) {
			console.log(ex);
		}
	};
	module.Extension.prototype.handleCommand = function(msg){
		switch(msg.command){
			case "createCards":
				console.log("createCards");
				this.createCards(msg.data);
				break;
			case "setPositions":
				console.log("setPositions");
				this.setPositions(msg.data);
				break;
			case "deleteCards":
				console.log("deleteCards");
				this.deleteCards(msg.data);
				break;
			case "saveCards":
				console.log("saveCards");
				this.saveCards();
				break;
			default:
				//not found
				break;
		};
	};
	
	//Called on remote extension when loaded
	module.Extension.prototype.register = function(){
		this.isConnected = false;
		var extension = this;
		
		//Ping until we get a response then send the register command
		this.pingIntervalId = setInterval(function(){
			if(!extension.isConnected){
				try{
					chrome.runtime.sendMessage(module.nowExtensionId, {command: "ping"}, function(response) {
						if(response && response.command == "pong"){
							extension.isConnected = true;
							clearInterval(extension.pingIntervalId);
							
							//Send the register command
							extension.port = chrome.runtime.connect(module.nowExtensionId);
							extension.port.onMessage.addListener(function(msg){extension.handleCommand(msg);});
							extension.sendCommand("registerExtension", extension.getDetails());
						}
					});
				} catch (ex) {
				}
			} else {
				clearInterval(extension.pingIntervalId);
			}
		},1000);
	};
	
	module.Extension.prototype.createCards = function(cards){
		if(this.isRemote){
			if(!cards){
				cards = {};
				for(var cardId in this.cards){
					cards[cardId] = this.cards[cardId].cardType;
				};
			}
			this.sendCommand("createCards",cards);
		} else {
			for(var cardId in cards){
				this.createCard(cards[cardId], cardId);
			}
		}
	};
	
	//In the remote extension, creates a card.
	module.Extension.prototype.createCard = function(cardType, cardId){
		 this.cards[cardId] = new this.cardTypes[cardType](cardId);
		 if(this.savedata && this.savedata[cardId])
			this.cards[cardId].setSaveData(this.savedata[cardId]);
		 this.cards[cardId].register();
		 this.saveCards(); //Save the new list of cards
	};
	
	module.Extension.prototype.setPositions = function(positions){
		for(var cardId in positions){
			if(this.cards[cardId])
				this.cards[cardId].setPosition(positions[cardId].column, positions[cardId].position);
		};
		this.saveCards();
		
		if(this.isRemote)
			this.sendCommand("setPositions", positions);
	};
	
	
	module.Extension.prototype.deleteCards = function(cardIds){
		if(this.isRemote){
			this.sendCommand("deleteCards",cardIds);
		} else {
			for(var cardId in cardIds){
				this.deleteCard(cardId);
			}
		}
	};
	
	//In the remote extension, deletes a card.
	module.Extension.prototype.deleteCard = function(cardId){
		this.cards[cardId].unregister();
		delete this.cards[cardId];
		this.saveCards();
	};
	
	return module;
}(cardsboard || {}));
