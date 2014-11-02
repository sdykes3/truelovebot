/*

This bot mimics the dynamics of relationship statuses, specifically the stereotypical "annoying"
posts that seem to track every detail of how the relationship is going. As such, my bot goes 
through 3 sets or "modes" of things that it can post. 

It starts with the initial dating phase, where it is "so in love" and only talks about it's 
significant other. In the second phase, it becomes apparent that things aren't going quite as 
well and more complaining occurs. Finally, there is a break-up and the bot will only post asking 
to hang out with friends very frequently, complain about it's ex, etc. After several posts in the
3rd mode, the bot will choose a new boyfriend and repeat the cycle.

I chose this character because of how common these types of posts are on social media. I felt that
it would be possible to make a very believable character this way, especially since I can use the 
tweets to show how it cycles though different relationships much like a real person would.

https://twitter.com/TrueLoveBot

*/

// DEBUG
var debug = false;		// if we don't want it to post to Twitter! Useful for debugging!

// Wordnik stuff
var WordnikAPIKey = '93aa5423455cecaa164040028bd01bd32d02fa49e4adfb296';
var request = require('request');
var stemmer = require('porter-stemmer').stemmer;
var inflection = require('inflection');
var pluralize = inflection.pluralize;
var capitalize = inflection.capitalize;
var singularize = inflection.singularize;
var pre;	// going great
var pre2;   // it's not working out
var pre3;   // after break-up
var counter = Math.floor(Math.random() * 3) + 4;    //counter used for changing modes
var mode = 1; //mode for with pre to use
var name;
var names;
var adj;
var days = ["Tuesday", "Christmas", "Hanukkah", "International Talk Like a Pirate Day", "Kwanzaa", "Earth Day", "the 5th of November", "President's Day", "Cinco De Mayo", "Monday", "Saturday"];

// Blacklist
var wordfilter = require('wordfilter');

// Twitter stuff
var Twit = require('twit');
var T = new Twit(require('./config.js'));

// Helper functions for arrays, picks a random thing
Array.prototype.pick = function() {
	return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

// Wordnik stuff
function nounUrl(minCorpusCount, limit) {
	return "http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=noun&minCorpusCount=" + minCorpusCount + "&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=" + limit + "&api_key=" + WordnikAPIKey;
}

function tweet() {
    var tweetText;
    console.log(counter + "  " + name);
    if (mode == 1) {
        tweetText = pre.pick();
    }
    if (mode == 2) {
        tweetText = pre2.pick();
    }
    if (mode == 3) {
        tweetText = pre3.pick();
    }
    counter--;
    if (counter == 0) {  //if counter is out, change mode
        mode++;
        counter = Math.floor(Math.random() * 3) + 4;
        if (mode>3) {  //if mode is at 3 and counter is out, go back to mode 1
            mode = 1;
            getNames();  //get a new boyfriend name
        }
    }
	
	if (debug) 
		console.log(tweetText);
	else
		T.post('statuses/update', {status: tweetText }, function(err, reply) {
			if (err !== null) {
				console.log('Error: ', err);
			}
			else {
				console.log('Tweeted: ', tweetText);
			}
		});
}

function followAMentioner() {
	T.get('statuses/mentions_timeline', { count:50, include_rts:1 },  function (err, reply) {
		  if (err !== null) {
			console.log('Error: ', err);
		  }
		  else {
		  	var sn = reply.pick().user.screen_name;
			if (debug) 
				console.log(sn);
			else {
				//Now follow that user
				T.post('friendships/create', {screen_name: sn }, function (err, reply) {
					if (err !== null) {
						console.log('Error: ', err);
					}
					else {
						console.log('Followed: ' + sn);
					}
				});
			}
		}
	});
}

function respondToMention() {
	T.get('statuses/mentions_timeline', { count:100, include_rts:0 },  function (err, reply) {
		  if (err !== null) {
			console.log('Error: ', err);
		  }
		  else {
		  	mention = reply.pick();
		  	mentionId = mention.id_str;
		  	mentioner = '@' + mention.user.screen_name;
		  	
		  	var tweet = mentioner + " " + pre.pick();
			if (debug) 
				console.log(tweet);
			else
				T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId }, function(err, reply) {
					if (err !== null) {
						console.log('Error: ', err);
					}
					else {
						console.log('Tweeted: ', tweet);
					}
				});
		  }
	});
}

function runBot() {
	console.log(" "); // just for legible logs
	var d=new Date();
	var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	console.log(ds);  // date/time of the request	

	// Get 200 nouns with minimum corpus count of 5,000 (lower numbers = more common words) 
	request(nounUrl(5000,200), function(err, response, data) {
		if (err != null) return;		// bail if no data
		nouns = eval(data);

		// Filter out the bad nouns via the wordfilter
		for (var i = 0; i < nouns.length; i++) {
			if (wordfilter.blacklisted(nouns[i].word))
			{
				console.log("Blacklisted: " + nouns[i].word);
				nouns.remove(nouns[i]);
				i--;
			}				
		}
		
        pre = [
            "Omg I love " + name + " so much!!! #love",
            name + " and me 5 evarrr <3 <3 <3",
            "I can't wait for my baby to get back from " + stemmer(verb.pick().word) + "ing, miss him so bad!!11",
            name + " bought me a " + singularize(nouns.pick().word) + " today!!! I cant believe it! #BestDayEver",
            "Gettin' ready to go " + stemmer(verb.pick().word) + "ing with " + name + " later, cant wait to see him again :DDD ",
            "I think this is the happiest I've ever been",
            "Goin' to see the " + capitalize(adj.pick().word) + " " + capitalize(pluralize(nouns.pick().word)) + " concert with my baby tonight :)",
            "The best part of waking up knowing Ill get to see " + name + "today :)",
            "I feel like " + name + " and I were made for eachother",
            "I'm so happy I cant believe it :) #happy",
            "I think he might be 'the one'!"
            
        ];

        pre2 = [
            "UGH, I cant believe " + name + " forgot our " + (Math.floor(Math.random() * 78) +12) + " hour anniversary! >:( ",
            name + " never takes me " + stemmer(verb.pick().word) + "ing anymore :( ",
            "Geez, how could he forget my favorite band is The " + capitalize(adj.pick().word) + " " + capitalize(pluralize(nouns.pick().word)) + "?! Seriously.",
            "I bought him a " + singularize(nouns.pick().word) + " for " + days.pick() + ", and he didnt even get me anything...",
            "How do I tell if hes cheating on me???",
            "Not having a very good day at all",
            "Had a bad fight with " + name + " earlier, I need someone to talk to...",
            "Im worried things arent working out with " + name + ", what should I do",

        ];

        pre3 = [
            "Single, hmu",
            "Done with all the drama. Time to start focusing on me for once #SingleLife",
            "Anyone wanna go " + stemmer(verb.pick().word) + "ing with me l8r? Need some company",
            "Just found one of his favorite " + pluralize(nouns.pick().word) + ", why  are breakups so hard :'(",
            "Going " + stemmer(verb.pick().word) + "ing in a bit, hmu if interested #PartyAllNight",
            "Feeling so " + adj.pick().word + " today. Anyone wanna go with me to get my nails done later?",
            name + " was such a loser. I'm so ready to move on.",
            "Anyone wanna chill tonight? hit me up"
                       
        ];
        
		///----- NOW DO THE BOT STUFF
		var rand = Math.random();

 		if(rand <= 1.60) {      //change to 0.60 if want to respond
			console.log("-------Tweet something");
			tweet();
			
		} else if (rand <= 0.80) {
			console.log("-------Tweet something @someone");
			respondToMention();
			
		} else {
			console.log("-------Follow someone who @-mentioned us");
			followAMentioner();
		}
	});
}

function getNames() {
	// Get 200 nouns with minimum corpus count of 5,000 (lower numbers = more common words) 
	request("http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=proper-noun&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=10&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5", function(err, response, data) {
		if (err != null) return;		// bail if no data
		names = eval(data);
        name = names.pick().word;
	});
}

function getAdjs() {
	// Get 200 nouns with minimum corpus count of 5,000 (lower numbers = more common words) 
	request("http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=adjective&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=20&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5", function(err, response, data) {
		if (err != null) return;		// bail if no data
		adj = eval(data);
	});
}

function getVerbs() {
	// Get 200 nouns with minimum corpus count of 5,000 (lower numbers = more common words) 
	request("http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=false&includePartOfSpeech=verb&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&limit=20&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5", function(err, response, data) {
		if (err != null) return;		// bail if no data
		verb = eval(data);
	});
}
// load data
getNames();
getAdjs();
getVerbs();

// Run the bot
runBot();

// And recycle every hour
setInterval(runBot, 1000 * 60 * 60);
//setInterval(runBot, 1000 * 5);

