var crypto = require('crypto'),
	dateFormat = require('dateformat');

var htmlentities = function(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function uniqid() {
    var newDate = new Date;
    return newDate.getTime();
}

function uuid (key, prefix) {
	prefix = prefix || '';

	key = (key === null) ? uniqid() : key;
	var hash = crypto.createHash('md5');
	hash.update(key);
	var chars = hash.digest('hex').toString();
	var uuid  = chars.substr(0,8) + '-';
	uuid += chars.substr(8,4) + '-';
	uuid += chars.substr(12,4) + '-';
	uuid += chars.substr(16,4) + '-';
	uuid += chars.substr(20,12);

	return prefix + uuid;
}

function FeedItem(rssVersion) {
	this.elements = {};    //Collection of feed elements

	this.version = rssVersion;
		
	this.addElement = function(elementName, content, attributes) {
		this.elements[elementName] = {'name' : elementName,
									'attributes' : attributes,
									'content' : content};
	}
		
	this.getElements = function() {
		return this.elements;
	}
		
	this.setDescription = function(description) {
		tag = (this.version === FeedBum.ATOM)? 'summary' : 'description'; 
		this.addElement(tag, description);
	}
		
	this.setTitle = function(title) {
		this.addElement('title', title);  	
	}

	this.setDate = function(date) {
		if(typeof date === 'number') {
			date = new Date(date);
		} else if (typeof date === 'string') {
			date = new Date(parseInt(date, 10));
		}

		var tag, value;
		if(this.version === FeedBum.ATOM) {
			tag    = 'updated';
			value  = dateFormat(date, FeedBum.DATE_ATOM);
		} else if(this.version === FeedBum.RSS2) {
			tag    = 'pubDate';
			value  = dateFormat(date, FeedBum.DATE_RSS);
		} else {
			tag    = 'dc:date';
			value  = dateFormat(date, "Y-m-d");
		}
		
		this.addElement(tag, value);    
	}
		

	this.setLink = function(link) {
		if(this.version === FeedBum.RSS2 || this.version === FeedBum.RSS1) {
			this.addElement('link', link);
		} else {
			this.addElement('link', '', {'href':link});
			this.addElement('id', uuid(link,'urn:uuid:'));
		} 
		
	}
		
	this.setEncloser = function(url, length, type) {
		attributes = {'url':url, 'length':length, 'type':type};
		this.addElement('enclosure', '', attributes);
	}

}

var FeedBum = function(rssVersion) {

	this.channels      = {};  // Collection of channel elements
	this.items         = [];  // Collection of items as object of FeedItem class.
	this.data          = {};  // Store some other version wise data

	var version   = null; 
	
	this.version = rssVersion || FeedBum.FeedBum.ATOM;

	// Setting default value for essential channel elements
	this.channels['title']        = this.version + ' Feed';
	this.channels['link']         = 'http://www.ajaxray.com/blog';
	
	//Tag names to encode in CDATA
	this.CDATAEncoding = ['description', 'content:encoded', 'summary'];


};

module.exports = FeedBum;

FeedBum.prototype.setChannelElement = function(elementName, content) {
	this.channels[elementName] = content ;
}
	
FeedBum.prototype.setChannelElementsFromArray = function(elementArray) {
	for (elementName in elementArray) {
		if(elementArray.hasOwnProperty(elementName)) {
			this.setChannelElement(elementName, elementArray[elemtnName]);
		}

	}
}

FeedBum.prototype.setDate = function(date) {
	if(typeof date === 'number') {
		date = new Date(date);
	} else if (typeof date === 'string') {
		date = new Date(parseInt(date, 10));
	}

	var tag, value;
	if(this.version === FeedBum.ATOM) {
		tag    = 'updated';
		value  = dateFormat(date, FeedBum.DATE_ATOM);
	} else if(this.version === FeedBum.RSS2) {
		tag    = 'pubDate';
		value  = dateFormat(date, FeedBum.DATE_RSS);
	} else {
		tag    = 'dc:date';
		value  = dateFormat(date, "Y-m-d");
	}
	
	this.setChannelElement(tag, value);    
}
	
FeedBum.prototype.genarateFeed = function() {	
	var str = '';
	str += this.printHead();
	str += this.printChannels();
	str += this.printItems();
	str += this.printTale();

	return str;
}

FeedBum.prototype.createNewItem = function() {
	item = new FeedItem(this.version);
	return item;
}
	
FeedBum.prototype.addItem = function(feedItem){
	this.items.push(feedItem);    
}
	
FeedBum.prototype.setTitle = function(title) {
	this.setChannelElement('title', title);
}
	
FeedBum.prototype.setDescription = function(desciption) {
	this.setChannelElement('description', desciption);
}
	
FeedBum.prototype.setLink = function(link){
	this.setChannelElement('link', link);
}

FeedBum.prototype.setImage = function(title, link, url) {
	this.setChannelElement('image', {'title' : title, 'link' : link, 'url' : url});
}

FeedBum.prototype.setChannelAbout = function(url) {
	this.data['ChannelAbout'] = url;    
}

FeedBum.prototype.printHead = function() {
	var out = '<?xml version="1.0" encoding="utf-8"?>' + "\n";
	
	if(this.version === FeedBum.RSS2) {
		out += '<rss version="2.0" ' +
				'xmlns:content="http://purl.org/rss/1.0/modules/content/" ' + 
				'xmlns:wfw="http://wellformedweb.org/CommentAPI/">\n';
	} else if(this.version === FeedBum.RSS1) {
		out += '<rdf:RDF ' +
				 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
				 'xmlns="http://purl.org/rss/1.0/"' +
				 'xmlns:dc="http://purl.org/dc/elements/1.1/">\n';
	} else if(this.version === FeedBum.ATOM) {
		out += '<feed xmlns="http://www.w3.org/2005/Atom"> \n\n';
	}

	return out;
}

FeedBum.prototype.printTale = function() {
	var out = '';
	if(this.version === FeedBum.RSS2) {
		out = '</channel>\n</rss>'; 
	} else if (this.version === FeedBum.RSS1) {
		out = '</rdf:RDF>';
	} else if(this.version === FeedBum.ATOM) {
		out = '</feed>';
	}

	return out;
}

FeedBum.prototype.makeNode = function(tagName, tagContent, attributes) {        
	var nodeText = '';
	var attrText = '';

	if(attributes) {
		for (attrib in attributes) {
			if(attributes.hasOwnProperty(attrib)) {
				attrText += ' ' + attrib + '="' + attributes[attrib] + '" ';	
			}
		}
	}
	
	if(tagContent && typeof tagContent !== 'string' && this.version === FeedBum.RSS1) {
		attrText = ' rdf:parseType="Resource"';
	}
	
	
	attrText += (this.CDATAEncoding.indexOf(tagName) > -1 && this.version === FeedBum.ATOM) ? ' type="html" ' : '';
	nodeText += (tagName && this.CDATAEncoding.indexOf(tagName) > -1) ? "<" + tagName + attrText + "><![CDATA[" : "<" + tagName + attrText + ">";
	 
	if(tagContent && typeof tagContent !== 'string') { 
		for (key in tagContent)  {
			if(tagContent.hasOwnProperty(key)) {
				nodeText += this.makeNode(key, tagContent[key]);
			}
		}
	} else {
		nodeText += (tagName && this.CDATAEncoding.indexOf(tagName) > -1) ? tagContent : htmlentities(tagContent);
	}           
		
	nodeText += (tagName && this.CDATAEncoding.indexOf(tagName) > -1) ? "]]></" + tagName + ">" : "</" + tagName + ">";

	return nodeText + '\n';
}
	
FeedBum.prototype.printChannels = function() {
	var out = '';
	//Start channel tag
	switch (this.version) {
	   case FeedBum.RSS2: 
			out = '<channel>\n';        
			break;
	   case FeedBum.RSS1: 
			out = (this.data['ChannelAbout']) ? 
							'<channel rdf:about="' + this.data['ChannelAbout'] + '">' : 
							'<channel rdf:about="' + this.channels['link'] + '">';
			break;
	}
	
	//Print Items of channel
	for(key in this.channels) {
		if(this.channels.hasOwnProperty(key)) {
			if(this.version === FeedBum.ATOM && key === 'link') {
				// FeedBum.ATOM prints link element as href attribute
				out += this.makeNode(key, '', {'href' : this.channels[key]});
				//Add the id for FeedBum.ATOM
				console.log('ID KEY ' + key + ' ' + this.channels[key]);
				out += this.makeNode('id', uuid(this.channels[key], 'urn:uuid:'));
			} else {
				out += this.makeNode(key, this.channels[key]);
			}    
		}
		
	}
	
	//RSS 1.0 have special tag <rdf:Seq> with channel 
	if(this.version === FeedBum.RSS1) {
		out += "<items>\n<rdf:Seq>\n";
		for (var i = 0; i < this.items.length; i++) {
			thisItems = this.items[i].getElements();
			out += '<rdf:li resource="' + thisItems['link']['content'] + '"/>\n';
		}

		out += "</rdf:Seq>\n</items>\n</channel>\n";
	}

	return out;
}
	
FeedBum.prototype.printItems = function() {    
	var out = ''
	for (var i = 0; i < this.items.length; i++) {
		thisItems = this.items[i].getElements();
		//the argument is printed as rdf:about attribute of item in rss 1.0 
		out += this.startItem(thisItems['link']['content']);

		for (feedItem in thisItems) {
			out += this.makeNode(feedItem, thisItems[feedItem]['content'], thisItems[feedItem]['attributes']); 
		}
		out += this.endItem();
	}

	return out;
}
	
FeedBum.prototype.startItem = function(about) {
	var out = '';
	if(this.version === FeedBum.RSS2) {
		out += '<item>\n'; 
	} else if(this.version === FeedBum.RSS1) {
		if(about) {
			out += '<item rdf:about="' + about + '">\n';
		} else {
			console.log("link element is not set .\n It's required for RSS 1.0 to be used as about attribute of item");
		}
	} else if(this.version === FeedBum.ATOM) {
		out += "<entry>\n";
	}    

	return out;
}

FeedBum.prototype.endItem = function() {
	var out = '';
	if(this.version === FeedBum.RSS2 || this.version === FeedBum.RSS1) {
		out += '</item>\n'; 
	} else if(this.version === FeedBum.ATOM) {
		out += '</entry>\n';
	}

	return out;
}
 
FeedBum.RSS1 = 'RSS 1.0';
FeedBum.RSS2 = 'RSS 2.0';
FeedBum.ATOM = 'FeedBum.ATOM';

FeedBum.DATE_ATOM = "yyyy-mm-dd'T'HH:MM:ss'Z'";
FeedBum.DATE_RSS = 'ddd, dd mmm yyyy HH:MM:ss Z';

