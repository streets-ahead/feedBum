var FeedBum = require('../lib/feedBum.js');
	
testFeed = new FeedBum(FeedBum.ATOM);
testFeed.writeData = function(data) {
	console.log(data);
}

testFeed.endResponse = function(data) {
	console.log(data);
}

//Setting the channel elements
//Use wrapper functions for common elements
testFeed.setTitle('Testing the RSS writer class');
testFeed.setLink('http://www.ajaxray.com/rss2/channel/about');


//For other channel elements, use setChannelElement() function
testFeed.setChannelElement('author', {'name' : 'Anis uddin Ahmad'});
testFeed.setDate( (new Date()).getTime());

//Adding a feed. Genarally this protion will be in a loop and add all feeds.

//Create an empty FeedItem
newItem = testFeed.createNewItem();

//Add elements to the feed item
//Use wrapper functions to add common feed elements
newItem.setTitle('The first feed');
newItem.setLink('http://www.yahoo.com');
newItem.setDate((new Date()).getTime());
//Internally changed to "summary" tag for ATOM feed
newItem.setDescription('This is test of adding CDATA Encoded description by the php <b>Universal Feed Writer</b> class');

//Now add the feed item	
testFeed.addItem(newItem);

//OK. Everything is done. Now genarate the feed.
console.log(testFeed.genarateFeed());
