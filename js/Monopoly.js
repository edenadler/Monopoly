var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 200;
Monopoly.doubleCounter = 0;
Monopoly.broke = false;

//prepare board
Monopoly.init = function(){
    $(document).ready(function(){
        Monopoly.adjustBoardSize();
        $(window).bind("resize",Monopoly.adjustBoardSize); //adjusts board size based on window
        Monopoly.initDice(); //put event listener on dice to click only when at appropriate time
        Monopoly.initProperties(); //allows the player to buy properties if they own the whole group
        Monopoly.initPopups(); //initial pop up, asks how many players you want
        Monopoly.start();  //makes intro popup show   
    });
};

//makes the intro popup show
Monopoly.start = function(){
    Monopoly.showPopup("intro");
};

//initializes the dice
Monopoly.initDice = function(){
    $(".dice").click(function(){
        if (Monopoly.allowRoll){
            Monopoly.rollDice();
        }
    });
};

Monopoly.initProperties = function(){
    $()

};
//retrieve the element that has the class current turn
Monopoly.getCurrentPlayer = function(){
    return $(".player.current-turn");
};

//retrieve the element's cell
Monopoly.getPlayersCell = function(player){
    return player.closest(".cell");
};

//retrieve the amount of money the player has
Monopoly.getPlayersMoney = function(player){
    return parseInt(player.attr("data-money"));
};

//update the amount of money the player has after certain action
Monopoly.updatePlayersMoney = function(player,amount){
    console.log("updateplayersmoney");
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    //if they are broke
    if (playersMoney < 0 ){
        console.log("broke");
        Monopoly.broke = true;
        
    }
    //if the player is not broke
    else {
        player.attr("data-money",playersMoney);
        player.attr("title",player.attr("id") + ": $" + playersMoney);
        Monopoly.playSound("chaching");
        Monopoly.updateScoreboard();
    }
};

Monopoly.updateScoreboard = function(){
    var numPlayers = $(".playerScore").length;
    for (var i = 1; i<=numPlayers; i++){
        var playerMoney = $("#player"+i).attr("data-money");
        $("#player"+i+"Score").text("Player "+i+" Score: $"+playerMoney);
    }
};

//rolls the dice to a random number
Monopoly.rollDice = function(){
    var result1 = Math.floor(Math.random() * 6) + 1 ;
    var result2 = Math.floor(Math.random() * 6) + 1 ;
    $(".dice").find(".dice-dot").css("opacity",0);
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1);
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1);
    //if a double is rolled...
    if (result1 == result2){
        Monopoly.doubleCounter ++;
    } 
    //if a double is not rolled...
    else {
        Monopoly.doubleCounter = 0;
    }
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer,"move",result1 + result2);
};

//moves the player the appropriate amount of steps according to the roll
Monopoly.movePlayer = function(player,steps){
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function(){
        if (steps == 0){
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};

//handles whatever the player lands on
Monopoly.handleTurn = function(){
    console.log("handleturn");
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    var playersMoney = parseInt(player.attr("data-money"));
    //if the player lands on their own property, give them a smiley face
    if (playerCell.attr("data-owner") === player.attr("id")){
        player.addClass("smile");
    }
    else if (playerCell.attr("data-owner") != player.attr("id")){
        player.removeClass("smile");
    }
    //if the property is available, allow them to buy it
    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);
    }
    //if the property is already owned, the player must pay the owner
    else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
         Monopoly.handlePayRent(player,playerCell);
    }
    //if the player lands on go to jail, send them to jail
    else if(playerCell.is(".go-to-jail")){
        Monopoly.handleGoToJail(player);
    }
    //if the player lands on the chance space
    else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);
    }
    //if the player lands on a community chest space
    else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    }
    //if the player lands on another space where nothing happpens
    else{
        Monopoly.setNextPlayerTurn();
    }
}

//sets the next player
Monopoly.setNextPlayerTurn = function(){
    console.log("setnextplayerturn");
    //if a double was rolled, make sure the current player gets to play again
    if (Monopoly.doubleCounter < 3 && Monopoly.doubleCounter!=0){
        console.log("double");
        Monopoly.allowRoll = true;
        Monopoly.initDice();
    }
    else if (Monopoly.doubleCounter === 3){
        var player = Monopoly.getCurrentPlayer();
        Monopoly.handleGoToJail();
    }
    else if (Monopoly.broke === true){
        Monopoly.handleRemovePlayer(Monopoly.getCurrentPlayer());
    }
    //if player did not roll a double...
    else {
        //switches class of current turn to the next player
        var currentPlayerTurn = Monopoly.getCurrentPlayer();
        var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));
        var nextPlayerId = playerId + 1;
        if (nextPlayerId > $(".player").length){
            nextPlayerId = 1;
        }
        currentPlayerTurn.removeClass("current-turn");
        var nextPlayer = $(".player#player" + nextPlayerId);
        nextPlayer.addClass("current-turn");

        //except: if the player is jailed, add another day to his jailtime count
        if (nextPlayer.is(".jailed")){
            var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
            currentJailTime++;
            nextPlayer.attr("data-jail-time",currentJailTime);
            //if the player who is in jail has done their time in jail, remove jailed class
            if (currentJailTime > 3){
                nextPlayer.removeClass("jailed");
                nextPlayer.removeAttr("data-jail-time");
            }
            Monopoly.setNextPlayerTurn();
            return;
        }
        if (Monopoly.broke === false){
            Monopoly.closePopup();
            Monopoly.allowRoll = true;
        }
    }
};

//if the player is broke, remove it
Monopoly.handleRemovePlayer = function(player){
    console.log("handleremoveplayer");
    Monopoly.showPopup("broke");
    var popup = Monopoly.getPopup("broke");
    popup.find("button").unbind("click").bind("click",function(){
            console.log("popup");
            Monopoly.handleRemove(player);
    });
};

//when the player buys property...
Monopoly.handleBuyProperty = function(player,propertyCell){
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click",function(){
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost);
        }else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

//if the player lands on another player's property, they have to pay rent
Monopoly.handlePayRent = function(player,propertyCell){
    console.log("handlepayrent");
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click",function(){
        var properyOwner = $(".player#"+ properyOwnerId);
        Monopoly.updatePlayersMoney(player, currentRent);
        Monopoly.updatePlayersMoney(properyOwner,currentRent);
        Monopoly.closeAndNextTurn();
    });
   Monopoly.showPopup("pay");
};

//when player is sent to jail
Monopoly.handleGoToJail = function(player){
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click",function(){
        Monopoly.handleAction(player,"jail");
    });
    Monopoly.showPopup("jail");
};

//when player lands on chance, and has to pick a chance card
Monopoly.handleChanceCard = function(player){
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = parseInt(currentBtn.attr("data-amount"));
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};

//when player lands on community space and has to pick a card
Monopoly.handleCommunityCard = function(player){
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(communityJson){
        popup.find(".popup-content #text-placeholder").text(communityJson["content"]);
        popup.find(".popup-title").text(communityJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",communityJson["action"]).attr("data-amount",communityJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click", function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = parseInt(currentBtn.attr("data-amount"));
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("community");
};

//send the player to jail
Monopoly.sendToJail = function(player){
    player.addClass("jailed");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

//gets the corresponding popup 
Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};

//retrieve the cost of the property
Monopoly.calculateProperyCost = function(propertyCell){
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};

//the rent payment is equal to half of the property cost
Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};

//close popup and go to the next turn
Monopoly.closeAndNextTurn = function(){
    if(Monopoly.broke){
        Monopoly.handleRemovePlayer(Monopoly.getCurrentPlayer());

    }else{
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
}
};

//initial popup upon starting game. Asks how many players you want 1-4.
Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};

//deal with player buying property
Monopoly.handleBuy = function(player,propertyCell,propertyCost){
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost){
        Monopoly.showErrorMsg();
        Monopoly.playSound("woopwoop");
    }else{
        Monopoly.updatePlayersMoney(player,propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        Monopoly.closeAndNextTurn();
    }
};

Monopoly.handleRemove = function(player){
    console.log("handleremove");
    $(".property").each(function(){
        console.log("each");
        if ($(this).hasClass(player)){
            $(this).removeClass(player)
                .addClass("available")
                .removeAttr("data-owner")
        }
    })
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerid = currentPlayerTurn.attr("id");
    $(playerid).remove("DIV");
    $("#"+playerid+"Score").remove("DIV");
    Monopoly.broke = false;
    Monopoly.updateScoreboard();
    Monopoly.setNextPlayerTurn();
};

//deal with player moving, paying or being jailed
Monopoly.handleAction = function(player,action,amount){
    switch(action){
        case "move":
            Monopoly.movePlayer(player,amount);
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount);
            if (Monopoly.broke === false){
                Monopoly.setNextPlayerTurn();
            }
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    if (Monopoly.broke === false){
        Monopoly.closePopup();
    }
};

//create number of players based on initial input from user
Monopoly.createPlayers = function(numOfPlayers){
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            //give the first player the first turn
            player.addClass("current-turn");
        }
        //give each player the starting amount of money
        player.attr("data-money",Monopoly.moneyAtStart);
        var playerColor = $("#player"+i).css("background-color");
        $(".scoreboard").append("<div class='playerScore' id='player"+i+"Score' style='color:"+playerColor+"'></div>");
        $(".properties").append("<div class='properties-container'></div>");
        $(".properties-container").append("<div class='house' id='player"+i+"House'></div>");
        $(".properties-container").append("<div class='hotel' id='player"+i+"Hotel'></div>");
    }
    Monopoly.updateScoreboard();
    Monopoly.initProperties();
};

//this helps move the player around the board
Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40){
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};

//handle the player passing go
Monopoly.handlePassedGo = function(){
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player,-200);
};

//test whether or not the user gave valid input of number of players
Monopoly.isValidInput = function(validate,value){
    var isValid = false;
    switch(validate){
        case "numofplayers":
            if(value >= 1 && value <= 6){
                isValid = true;
            }
    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

}

//show a message if the input is not valid that the use gave
Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(500,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(500,0);
    },7000);
};

//gets the size of the window and builds the board accordingly
Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}

//close the pop up box
Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};

//play a sound
Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}

//shows the appropriate popup message
Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();