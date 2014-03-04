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
	var apps = function(cardId){this.setCardId(cardId);};
	apps.prototype = new module.Card("apps", chrome.runtime.id);
	apps.prototype.name = "Apps";
	apps.prototype.author = "Matthew Morrow";
	apps.prototype.description = "The current Chrome apps";
	
	var getLargestIcon = function(icons){
		var largestSize = 0;
		var largestIdx = -1;
		for(var i = 0; i<icons.length; ++i){
			if(icons[i].size > largestSize){
				largestSize = icons[i].size;
				largestIdx = i;
			}
		}
		if(largestIdx == -1)
			return null;
		return icons[largestIdx];
	};
	
	apps.prototype.create = function(){
		var card = this;
		card.style.html("");
		card.style.append(".app {display:block; width:20%; float:left; padding:5px; box-sizing:border-box; text-align:center;overflow:hidden;}");
		card.style.append(".app-img {width:64px; height:64px; display:block;margin:auto;}");
		card.style.append(".app-name {width:100%;marign:auto;font-size:0.8rem;text-overflow:ellipsis;display:block;white-space:nowrap;overflow:hidden;}");
		
		chrome.management.getAll(function(result){
			card.front.html("");
			for(var i = 0; i < result.length; ++i){
				if(result[i].isApp){
					var appIcon = $("<a class=\"app\"></a>");
					appIcon.attr("href", result[i].appLaunchUrl);
					appIcon.append($("<img class=\"app-img\" src=\"" + getLargestIcon(result[i].icons).url + "\" />"));
					appIcon.append($("<span class=\"app-name\">"+result[i].name+"</span>"));
					if(result[i].name = "Chrome Remote Desktop")
						appIcon.attr("target","_blank");
					card.front.append(appIcon);
				}
			};
			card.front.append($("<div style=\"clear:both;\"></div>"));
			card.sendUpdate("updated");
		});
	};

	//Record the cards and register this extension
	module.baseExtension.cardTypes["apps"] = apps;
	
	return module;
}(cardsboard ));