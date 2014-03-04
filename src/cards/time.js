/*
Copyright 2014 Matthew M Morrow
http://matthewmmorrow.com

This file is part of Cards Board - Chrome Package an extension for the Cards Board extension for Chrome.
http://cardsboard.oneweekonewebsite.com

Cards Board - Chrome Package is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cards Board - Chrome Package is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cards Board - Chrome Package.  If not, see <http://www.gnu.org/licenses/>.
*/

var cardsboard = (function (module) {
	//Create a card constructor
	var time = function(cardId){this.setCardId(cardId);};
	time.prototype = new module.Card("time", chrome.runtime.id);
	time.prototype.name = "Time";
	time.prototype.author = "Matthew Morrow";
	time.prototype.description = "The current time";
	
	time.prototype.create = function(){
		this.style.html(".time{ margin:auto; text-align:center; line-height;1em;}.hours{font-weight:500;} .minutes{font-weight:300;} .seconds{font-weight:100;} .date{text-align:center;}.space{width:15%;height:1px;}");
		this.drawTime();
		
		var card = this;
		this.interval = setInterval(function(){
			card.drawTime();
			card.sendUpdate("updated");
		},100);
	};
	
	time.prototype.delete = function(){
		clearInterval(this.interval);
	};
	
	time.prototype.days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	time.prototype.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	
	time.prototype.drawTime = function(){
		var stime = new Date();
		var bigtext = $("<div class='bigtext'></div>");
		bigtext.append("<div class='time'>&nbsp;&nbsp;<span class='hours'>" + this.pad(stime.getHours()) + "</span>:<span class='minutes'>" + this.pad(stime.getMinutes()) + "</span>:<span class='seconds'>" + this.pad(stime.getSeconds()) + "</span>&nbsp;&nbsp;</div>");
		bigtext.append($("<div class='date'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+this.days[stime.getDay()] + " " + this.months[stime.getMonth()] + " " + stime.getDate() + ", " + stime.getFullYear() +"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>"));
		this.front.html("");
		this.front.append(bigtext);
	};
	
	time.prototype.pad = function(str){
		if((str + "").length == 1)
			return "0" + str;
		return str;
	};

	//Record the cards and register this extension
	module.baseExtension.cardTypes["time"] = time;
	
	return module;
}(cardsboard));