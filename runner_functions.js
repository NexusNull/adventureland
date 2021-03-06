// #NOTE: If you want to see a new function/feature, just request it at: https://github.com/kaansoral/adventureland/issues
// Or at #feedback in Discord: https://discord.gg/4SXJGU
var character = {
    // This object proxies the real parent.character
    // Normal entities have normal coordinates, their {x,y}'s are equal to their {real_x,real_y}'s
    // The character object is special, it's always in the middle of the screen, so it has static {x,y}'s
    // Added this wrapper so instead of using .real_x and .real_y on all entities, .x and .y's can be used uniformly
    "note": "This is a proxy object, the real character is in parent.character",
    "properties": ["x", "y"],
}
Object.defineProperty(character, 'x', {
    get: function () {
        return parent.character.real_x;
    }, set: function () {
        game_log("You can't set coordinates manually, use the move(x,y) function!");
    }
});
Object.defineProperty(character, 'y', {
    get: function () {
        return parent.character.real_y;
    }, set: function () {
        game_log("You can't set coordinates manually, use the move(x,y) function!");
    }
});
for (var p in parent.character) proxy(p); // Not all properties are sadly available right away, new properties are captured imperfectly
// var character=parent.character; // Old [25/06/2018]
var G = parent.G; // Game Data - Use show_json(Object.keys(G)); and inspect individual data with show_json(G.skills) and alike
var safeties = true; // Prevents common delay based issues that cause many requests to be sent to the server in a burst that triggers the server to disconnect the character
server = {
    mode: parent.gameplay, // "normal", "hardcore", "test"
    pvp: parent.is_pvp, // true for PVP servers, use is_pvp() for maps
    region: parent.server_region, // "EU", "US", "ASIA"
    id: parent.server_identifier, // "I", "II", "PVP", "TEST"
}
/**
 * @namespace game
 */
game = {
    platform: parent.is_electron && "electron" || "web", // "electron" for Steam, Mac clients, "web" for https://adventure.land
    graphics: !parent.no_graphics, // if game.graphics is false, don't draw stuff to the game in your Code
    html: !parent.no_html, // if game.html is false, this character is loaded in [CODE] mode
}
//#NOTE: Most new features are experimental - for #feedback + suggestions: https://discord.gg/X4MpntA [05/01/18]
/**
 * Loads a character in [CODE] mode.
 * @param {string} name                     - The name of the character to load.
 * @param {string|number} code_slot_or_name - The name or slot number of the code to run.
 */
function start_character(name, code_slot_or_name) {
    // Loads a character in [CODE] mode
    parent.start_character_runner(name, code_slot_or_name)
}
/**
 * Stops the character from running.
 * @param {string} name         - The name of the character to stop.
 */
function stop_character(name) {
    parent.stop_character_runner(name)
}
/**
 * Commands the character in [CODE] mode (doesn't work with multiple windows).
 * @param {string} name         - The name of the character to command.
 * @param {string} code_snippet - The code to run.
 * @example
 * command_character("Me", "say('OMG')");
 */
function command_character(name, code_snippet) {
    // Commands the character in [CODE] mode
    parent.character_code_eval(name, code_snippet)
}
/**
 * Returns active characters and their state. States: "self", "starting","loading", "active", "code". 
 * @return {Object.<string, string>} Example return: {"Me":"self","Protector":"loading"}
 */
function get_active_characters() {
    // States: "self", "starting","loading", "active", "code"
    // Example: {"Me":"self","Protector":"loading"}
    return parent.get_active_characters()
}
/**
 * Checks if you're in a PVP zone.
 * @return {boolean} True if you're in a PVP zone.
 */
function is_pvp() {
    return G.maps[character.map].pvp || server.is_pvp;
}
/**
 * Checks if the Entity if is an NPC or not.
 * @param {Entity} entity - The entity to check.
 * @return {boolean}        True if the Entity is an NPC.
 */
function is_npc(entity) {
    if (entity && (entity.npc || entity.type == "npc")) return true;
}
/**
 * Checks if the Entity if is a monster or not.
 * @param {Entity} entity - The entity to check.
 * @return {boolean}        True if the Entity is a monster.
 */
function is_monster(entity) {
    if (entity && entity.type == "monster") return true;
}
/**
 * Checks if the Entity if is a character or not.
 * @param {Entity} entity - The entity to check.
 * @return {boolean}        True if the Entity is a character.
 */
function is_character(entity) {
    if (entity && entity.type == "character" && !entity.npc) return true;
}
/**
 * Same as is_character.
 * @param {Entity} e - The entity to check.
 * @return {boolean}   True if the Entity is a character.
 */
function is_player(e) {
    return is_character(e);
} // backwards-compatibility
/**
 * Activates an item, likely a booster, in the num-th inventory slot
 * @param {number} num number of Inventory slot
 */
function activate(num) // activates an item, likely a booster, in the num-th inventory slot
{
    parent.activate(num);
}
/**
 * Shifts an item, likely a booster, in the num-th inventory slot to s pecific mode
 * shift(0,'goldbooster'); would set the booster int the first inventory slot to gold mode
 * Other modes are "xpbooster" and "luckbooster"
 * @param {number} num   - Position of Inventory Slot starting from 0
 * @param {string} name  - name of the Item
 */
function shift(num, name) // shifts an item, likely a booster, in the num-th inventory slot
{
    // shift(0,'xpbooster')
    // shift(0,'luckbooster')
    // shift(0,'goldbooster')
    parent.shift(num, name);
}
/**
 * (WIP) Check if the cooldown of a class skill has passed
 * @param {string} name - name of skill
 * @returns {boolean}   - true of cooldown has passed
 */
function can_use(name) {
    if (G.skills[name] && G.skills[name].class && !in_arr(character.ctype, G.skills[name].class)) return false; // checks the class
    return parent.can_use(name); // checks the cooldown
}
/**
 * if name parameter is a number, the character will try to equip the Item in the specified slot.
 * Otherwise it will try to cast the skill with that name and Target
 * @param {number|string} name - skill name or item slot
 * @param {Monster} [target]   - target Entity when using skill
 */
function use(name, target) // a multi-purpose use function, works for skills too
{
    if (isNaN(name)) // if name is not an integer, use the skill
    {
        if (!target) target = get_target();
        parent.use_skill(name, target);
    } else {
        // for example, if there is a potion at the first inventory slot, use(0) would use it
        equip(name);
    }
}
/**
 * Will use a skill on the specified target
 * If no target is specified the current character target will be used
 * @param {string} name         - name of skill
 * @param {Monster} [target]    - target Entity
 */
function use_skill(name, target) {
    // for blink: use_skill("blink",[x,y])
    if (!target) target = get_target();
    parent.use_skill(name, target);
}
/**
 * Deposits gold into the bank.
 * @param {number} gold - The amount of gold to deposit.
 */
function bank_deposit(gold) {
    if (!character.bank) return game_log("Not inside the bank");
    parent.socket.emit("bank", {operation: "deposit", amount: gold});
}
/**
 * Withdraws gold from the bank.
 * @param {number} gold - The amount of gold to withdraw.
 */
function bank_withdraw(gold) {
    if (!character.bank) return game_log("Not inside the bank");
    parent.socket.emit("bank", {operation: "withdraw", amount: gold});
}
/**
 * Stores/swaps an item in the bank.
 * @param {number} num            - The inventory slot to store/swap (-1 to store to first slot available).
 * @param {string=} pack          - The bank to use, valid values are one of ["items0","items1","items2","items3","items4","items5","items6","items7"].
 * @param {number} [pack_slot=-1] - The slot in the bank to use (-1 to store to first available).
 * @example
 * bank_store(0); // Stores the first item in inventory in the first/best spot in bank.
 * bank_store(-1, "items0", 0); // Withdraws the first item in the first bank to the first available inventory slot.
 */
function bank_store(num, pack, pack_slot) {
    // bank_store(0) - Stores the first item in inventory in the first/best spot in bank
    // parent.socket.emit("bank",{operation:"swap",pack:pack,str:num,inv:num});
    // Above call can be used manually to pull items, swap items and so on - str is from 0 to 41, it's the storage slot #
    // parent.socket.emit("bank",{operation:"swap",pack:pack,str:num,inv:-1}); <- this call would pull an item to the first inventory slot available
    // pack is one of ["items0","items1","items2","items3","items4","items5","items6","items7"]
    if (!character.bank) return game_log("Not inside the bank");
    if (!character.items[num]) return game_log("No item in that spot");
    if (!pack_slot) pack_slot = -1; // the server interprets -1 as first slot available
    if (!pack) {
        var cp = undefined, cs = undefined;
        bank_packs.forEach(function (cpack) {
            if (!character.bank[cpack]) return;
            for (var i = 0; i < 42; i++) {
                if (pack) return;
                if (can_stack(character.bank[cpack][i], character.items[num])) // the item we want to store and this bank item can stack - best case scenario
                {
                    pack = cpack;
                }
                if (!character.bank[cpack][i] && !cp) {
                    cp = cpack;
                }
            }
        });
        if (!pack && !cp) return game_log("Bank is full!");
        if (!pack) pack = cp;
    }
    parent.socket.emit("bank", {operation: "swap", pack: pack, str: -1, inv: num});
}
/**
 * Move/swap slots in the inventory.
 * @param {number} a - The first slot to swap.
 * @param {number} b - The second slot to swap.
 */
function swap(a, b) // inventory move/swap
{
    parent.socket.emit("imove", {a: a, b: b});
}
/**
 * The quantity of items named "name" in the inventory.
 * @param {string} name - The name of the item to count.
 * @returns {number}    - The number of times the item name was found in the inventory.
 */
function quantity(name) {
    var q = 0;
    for (var i = 0; i < character.items.length; i++) {
        if (character.items[i] && character.items[i].name == name) q += character.items[i].q || 1;
    }
    return q;
}
/**
 * Returns an object containing all the stat properties of an item
 * @param {Gear} item             - The Item in question
 * @returns {ItemStats|null}      - An Object containing all stats and there number or null on error
 */
function item_properties(item) // example: item_properties(character.items[0])
{
    if (!item || !item.name) return null;
    return calculate_item_properties(G.items[item.name], item);
}
/**
 *  The item Grade in Number format.
 *  -1: Invalid Input
 *  0 : Normal
 *  1 : High
 *  2 : Rare
 * @param {Object} item
 * @param {string} item.name
 * @returns {number} - {-1:Something went wrong, 0:Normal, 1:High, 2:Rare}
 */
function item_grade(item) // example: item_grade(character.items[0])
{
    if (!item || !item.name) return -1;
    return calculate_item_grade(G.items[item.name], item);
}
/**
 * Returns how much the item is worth in gold
 * @param {Gear|Consumables} item
 * @returns {number} - How the item is worth in gold when sold to an npc
 * @example
 * item_value(character.items[0]);
 */
function item_value(item) // example: item_value(character.items[0])
{
    if (!item || !item.name) return 0;
    return calculate_item_value(item);
}
function transport(map, spawn) {
    parent.socket.emit("transport", {to: map, s: spawn});
}
function is_paused() {
    return parent.paused;
}
function pause() // Pauses the Graphics
{
    parent.pause();
}
/**
 * Return Socket.IO socket, this is the Object which the game uses to communicate with the server
 * @returns {socket}
 */
function get_socket() {
    return parent.socket;
}
/**
 * Returns current map the player is on
 * @returns {Map} current map the player is on
 */
function get_map() {
    return parent.G.maps[parent.current_map];
}
/**
 * When CODE is active uses a window in the bottom right hand corner to display a status messages
 * The window is pretty small so keep it short.
 * @param {string} text the text that should be displayed
 * @param {string} [color] the color in which the text should be displayed
 */
function set_message(text, color) {
    if (color) text = "<span style='color: " + color + "'>" + text + "</span>";
    if (!game.html) parent.set_status(text);
    else {
        current_message = text;
        // $('#gg').html(text); // added the code_draw function for performance [15/01/18]
        // also visit set_status on functions.js for a challenge (note to self)
        // Last note for now: There's probably a browser/chrome bug
        // If you move the cursor into the iframe once - each set_message breaks the cursor
        // Whether code_draw is used or not
        // That's why iframe's have "pointer-events: none;"s now
    }
}
/**
 * Uses the game log to print out a message
 * @param {string} message the message to print
 * @param {string} [color=#51D2E1] the color in which to display the message
 */
function game_log(message, color) {
    if (!color) color = "#51D2E1";
    parent.add_log(message, color);
}
/**
 * Returns Entity which the Entity is targeting
 * @param {Monster} entity The Entity of which to fetch the target
 * @returns {Monster|null} the target entity or null if the entity has no target
 */
function get_target_of(entity) // .target is a Name for Monsters and `id` for Players - this function return whatever the entity in question is targeting
{
    if (!entity || !entity.target) return null;
    if (character.id == entity.target) return character;
    for (var id in parent.entities) {
        var e = parent.entities[id];
        if (e.id == entity.target) return e;
    }
    return null;
}
/**
 * The current target Entity of the character without checks
 * @returns {Monster|Player|null} - The current target Entity of the character
 */
function get_target() {
    if (parent.ctarget && !parent.ctarget.dead) return parent.ctarget;
    return null;
}
/**
 * The current target Entity of the character but with additional checks.
 * This prevents the targeting of already dead targets or players
 * @returns {Monster|null} - The current target Entity of the character
 */
function get_targeted_monster() {
    if (parent.ctarget && !parent.ctarget.dead && parent.ctarget.type == 'monster') return parent.ctarget;
    return null;
}
/**
 * Change the targeted entity
 * @param {Monster} target the new target
 * @param {boolean} [send=false] - send change target to server
 */
function change_target(target, send) {
    parent.ctarget = target;
    if (!send) //no need to send the target on default for CODE, some people are using change_target 5-6 times in an interval
    {
        // user change_target(target,true) from now on to send the target to the server explicitly [23/10/16]
        if (target) parent.last_id_sent = target.id;
        else parent.last_id_sent = '';
    }
    parent.send_target_logic();
}
/**
 * Checks if there is a clear path to the coordinates or the entity.
 * For an entity you don't have to supply the second argument
 * @param {Monster|Player|number} x This can be either be a number or an entity. When this is an entity the function will check if there is a clear path to that entity.
 * When this a number the function also expects the y coordinate to be given.
 * @param {number} [y] The y coordinate of the position
 * @returns {boolean} Whether or not there is a clear path the the coordinates
 */
function can_move_to(x, y) {
    if (is_object(x)) y = x.real_y, x = x.real_x;
    return can_move({
        map: character.map,
        x: character.real_x,
        y: character.real_y,
        going_x: x,
        going_y: y,
        base: character.base
    });
}
function xmove(x, y) {
    if (can_move_to(x, y)) move(x, y);
    else smart_move({x: x, y: y});
}
/**
 * Checks if the Entity is in attack range
 * @param {Player|Monster} target The entity to check
 * @returns {boolean} True if the entity is in range
 */
function in_attack_range(target) // also works for priests/heal
{
    if (!target) return false;
    if (parent.distance(character, target) <= character.range) return true;
    return false;
}
/**
 * Checks if the character is able to attack the target
 * @param {Monster|Player} target - the Entity for which to check
 * @returns {boolean} True if the target can be healed
 */
function can_attack(target) // also works for priests/heal
{
    // is_disabled function checks .rip and .stunned
    if (!target) return false;
    if (!parent.is_disabled(character) && in_attack_range(target) && new Date() >= parent.next_attack) return true;
    return false;
}
/**
 * Checks if the character is able to heal the target
 * Same as can_attack but with a more intuitive name
 * @param {Monster|Player} target - the Entity for which to check
 * @returns {boolean} True if the target can be healed
 */
function can_heal(t) {
    if (is_monster(t)) return false; // ?? :D [11/10/18]
    return can_attack(t);
}
/**
 * return true if the entity is moving
 * @param {Player|Character|Monster} entity The entity in question
 * @returns {boolean} True if the entity is moving
 */
function is_moving(entity) {
    if (entity.me && smart.moving) return true;
    if (entity.moving) return true;
    return false;
}
/**
 * Is the entity using the town teleportation skill
 * @param entity {Player|Character|Monster} The entity in question
 * @returns {boolean} True if the entity using the teleport skill
 */
function is_transporting(entity) {
    if (entity.c.town) return true;
    if (entity.me && parent.transporting) return true;
    return false;
}
/**
 * Tries to attack the target
 * @param {Player|Monster} target - Target to attack
 */
function attack(target) {
    if (safeties && mssince(last_attack) < 400) return;
    if (!target) {
        game_log("Nothing to attack()", "gray");
        return;
    }
    if (target.type == "character") parent.player_attack.call(target);
    else parent.monster_attack.call(target);
    last_attack = new Date();
}
/**
 * Tries to heal the targeted Character
 * @param {Player} target The target to heal
 */
function heal(target) {
    if (safeties && mssince(last_attack) < 400) return;
    if (!target) {
        game_log("No one to heal()", "gray");
        return;
    }
    parent.player_heal.call(target);
    last_attack = new Date();
}
/**
 * Buys items from NPC. The NPC has to be near enough to be able to buy from him. Usually 400px
 * @param {String} name      - Name of the Item
 * @param {number} quantity  - Quantity
 */
function buy(name, quantity) //item names can be spotted from show_json(character.items) - they can be bought only if an NPC sells them
{
    parent.buy(name, quantity);
}
/**
 * Same as buy, but will only ever use gold.
 * @param {String} name      - Name of the Item
 * @param {number} quantity  - Quantity
 */
function buy_with_gold(name, quantity) {
    parent.buy_with_gold(name, quantity);
}
/**
 * Same as buy, but will only ever use shells.
 * @param {String} name      - Name of the Item
 * @param {number} quantity  - Quantity
 */
function buy_with_shells(name, quantity) {
    parent.buy_with_shells(name, quantity);
}
/**
 * Tries to sell the Item in the num-th inventory slot to an npc.
 * @param {number} num       - Inventory slot
 * @param {number} quantity  - Quantity
 */
function sell(num, quantity) //sell an item from character.items by it's order - 0 to N-1
{
    parent.sell(num, quantity);
}
/**
 * Equips the Item in the num-th inventory Slot starting from 0.
 * @param {number} num              - The slot the items is currently in
 * @param {number} [slot] Optional  - The slot in which to put the item
 * @example
 * equip(1);
 * equip(0, "mainhand"); // show_json(character.slots) => to see slot options
 */
function equip(num, slot) // slot is optional
{
    parent.socket.emit("equip", {num: num, slot: slot});
}
/**
 * Unequips the Item in the specified character slot.
 * @param {string} slot - the slot in which to remove the item
 * @example
 * unequip("mainhand"); // show_json(character.slots) => to see slot options
 */
function unequip(slot) // show_json(character.slots) => to see slot options
{
    parent.socket.emit("unequip", {slot: slot});
}
/**
 * Puts an item up for sale
 * @param {number} num        - The slot the item is in
 * @param {number} trade_slot - The slot in the trade window where is should appear
 * @param {number} price      - The price of the item
 * @param {number=} quantity  - The amount of items
 */
function trade(num, trade_slot, price, quantity) // where trade_slot is 1 to 16 - example, trade(0,4,1000) puts the first item in inventory to the 4th trade slot for 1000 gold [27/10/16]
{
    if (!is_string(trade_slot) || !trade_slot.startsWith("trade")) trade_slot = "trade" + trade_slot;
    parent.trade(trade_slot, num, price, quantity || 1);
}
/**
 * Buys an item from a player's shop.
 * @param {Player} target     - The player entity you want to buy from
 * @param {number} trade_slot - The trade slot in which the item is you want to buy
 */
function trade_buy(target, trade_slot) // target needs to be an actual player
{
    parent.trade_buy(trade_slot, target.id, target.slots[trade_slot].rid); // the .rid changes when the item in the slot changes, it prevents swap-based frauds [22/11/16]
}
/**
 * Uses the upgrade npc to upgrade items.
 * @param {number} item_num - Slot number of the item you want to upgrade
 * @param {number} scroll_num - Slot number of the scroll you want to upgrade
 * @param {number} [offering_num] - Slot number of the offering you want to use
 */
function upgrade(item_num, scroll_num, offering_num) //number of the item and scroll on the show_json(character.items) array - 0 to N-1
{
    parent.u_item = item_num;
    parent.u_scroll = scroll_num;
    parent.u_offering = offering_num;
    parent.upgrade();
}
/**
 * Uses the upgrade npc to combine jewelery
 * Combining works by taking 3 jewelery items of the same type and a scroll
 * for example -> compound(0,1,2,6) -> 3 items in the first 3 slots, scroll at the 6th spot
 * On the normal Server you have to be close to the npc for it to work.
 * @param {number} item0 - Item one
 * @param {number} item1 - Item two
 * @param {number} item2 - Item three
 * @param {number} scroll_num
 * @param {number} [offering_num]
 */
function compound(item0, item1, item2, scroll_num, offering_num) // for example -> compound(0,1,2,6) -> 3 items in the first 3 slots, scroll at the 6th spot
{
    parent.c_items = [item0, item1, item2];
    parent.c_last = 3;
    parent.c_scroll = scroll_num;
    parent.c_offering = offering_num;
    parent.compound();
}
function craft(i0, i1, i2, i3, i4, i5, i6, i7, i8)
// for example -> craft(null,0,null,null,1,null,null,2,null)
// sends 3 items to be crafted, the 0th, 1st, 2nd items in your inventory, and it places them all in the middle column of crafting
{
    parent.cr_items = [i0, i1, i2, i3, i4, i5, i6, i7, i8];
    parent.craft();
}
/**
 * Tries to exchange an item in a specific inventory slot. This function also works with quest items and when multiple items are exchanged at once e.g. seashells.
 * @param {number} item_num - Inventory slot
 */
function exchange(item_num) {
    parent.e_item = item_num;
    parent.exchange(1);
}
/**
 * Acts as if the player had typed the message into the chat and then send it.
 * This also allows for the use of commands.
 * @param {string} message - The message to send
 */
function say(message) // please use MORE responsibly, thank you! :)
{
    parent.say(message, 1);
}
/**
 * Sets the character moving to specific coordinates, before using this you should check if you can actually walk to your target or else you might end up somewhere else.
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function pm(name, message) // please use responsibly, thank you! :)
{
    parent.private_say(name, message, 0)
}
function move(x, y) {
    if (!can_walk(character)) return;
    parent.move(x, y);
}
function cruise(speed) {
    parent.socket.emit("cruise", speed);
}
/**
 * A debug Command which opens a Window and shows the json representation of the Object.
 * @param {Object} e - The Object you like to inspect
 */
function show_json(e) // renders the object as json inside the game
{
    parent.show_json(parent.game_stringify(e, 2));
}
/**
 * The entity of a player, only works when the player is visible.
 * @param {String} name - The name of the character
 * @returns {Player} - The Player Object
 */
function get_player(name) // The player by name, if the player is within the vision area
{
    var target = null, entities = parent.entities;
    if (name == character.name) target = character;
    for (i in entities) if (entities[i].type == "character" && entities[i].name == name) target = entities[i];
    return target;
}
/**
 * Get nearest Monster out of the entities array that meets certain criteria and returns it.
 * @param {Object} args
 * @param {string} args.type        - the monster type of {@link Monster}
 * @param {number} args.min_xp      - Minimum xp that the Monster should give
 * @param {number} args.max_att     - The Maximum attack value a Monster should have
 * @param {boolean} args.no_target  - Attack only targets that have no target
 * @param {boolean} args.path_check - Check If you can walk straight to the target
 * @returns {Monster}
 */
function get_nearest_monster(args) {
    //args:
    // max_att - max attack
    // min_xp - min XP
    // target: Only return monsters that target this "name" or player object
    // no_target: Only pick monsters that don't have any target
    // path_check: Checks if the character can move to the target
    // type: Type of the monsters, for example "goo", can be referenced from `show_json(G.monsters)` [08/02/17]
    var min_d = 999999, target = null;
    if (!args) args = {};
    if (args && args.target && args.target.name) args.target = args.target.name;
    if (args && args.type == "monster") game_log("You used monster.type, which is always 'monster', use monster.mtype instead");
    for (id in parent.entities) {
        var current = parent.entities[id];
        if (current.type != "monster" || current.dead) continue;
        if (args.type && current.mtype != args.type) continue;
        if (args.min_xp && current.xp < args.min_xp) continue;
        if (args.max_att && current.attack > args.max_att) continue;
        if (args.target && current.target != args.target) continue;
        if (args.no_target && current.target && current.target != character.name) continue;
        if (args.path_check && !can_move_to(current)) continue;
        var c_dist = parent.distance(character, current);
        if (c_dist < min_d) min_d = c_dist, target = current;
    }
    return target;
}
/**
 * Get nearest Hostile. This function is mainly for finding hostile players in your proximity
 * @param {Object} args
 * @param {Array.<string>} [args.exclude] An array of Player names which will not be considered hostile
 * @param {boolean} [args.friendship=true] Should friends be considered friendly
 * @returns {Player}
 */
function get_nearest_hostile(args) // mainly as an example [08/02/17]
{
    var min_d = 999999, target = null;
    if (!args) args = {};
    if (args.friendship === undefined && character.owner) args.friendship = true;
    for (id in parent.entities) {
        var current = parent.entities[id];
        if (current.type != "character" || current.rip || current.invincible || current.npc) continue;
        if (current.party && character.party == current.party) continue;
        if (current.guild && character.guild == current.guild) continue;
        if (args.friendship && in_arr(current.owner, parent.friends)) continue;
        if (args.exclude && in_arr(current.name, args.exclude)) continue; // get_nearest_hostile({exclude:["Wizard"]}); Thanks
        var c_dist = parent.distance(character, current);
        if (c_dist < min_d) min_d = c_dist, target = current;
    }
    return target;
}
/**
 * If low, regenerates MP or HP, using potions if available.
 */
function use_hp_or_mp() {
    if (safeties && mssince(last_potion) < 600) return;
    var used = false;
    if (new Date() < parent.next_potion) return;
    if (character.mp / character.max_mp < 0.2) use('use_mp'), used = true;
    else if (character.hp / character.max_hp < 0.7) use('use_hp'), used = true;
    else if (character.mp / character.max_mp < 0.8) use('use_mp'), used = true;
    else if (character.hp < character.max_hp) use('use_hp'), used = true;
    else if (character.mp < character.max_mp) use('use_mp'), used = true;
    if (used) last_potion = new Date();
}
/**
 * Find the first 2 chests and opens them
 * @param {boolean} commander allows code characters to make their commanders' loot instead, extremely useful
 */
function loot(commander) {
    // loot(true) allows code characters to make their commanders' loot instead, extremely useful [14/01/18]
    var looted = 0;
    if (safeties && mssince(last_loot) < 200) return;
    last_loot = new Date();
    for (id in parent.chests) {
        var chest = parent.chests[id];
        if (safeties && (chest.items > character.esize || chest.last_loot && mssince(chest.last_loot) < 1600)) continue;
        chest.last_loot = last_loot;
        if (commander) parent.parent.open_chest(id);
        else parent.open_chest(id);
        // parent.socket.emit("open_chest",{id:id}); old version [02/07/18]
        looted++;
        if (looted == 2) break;
    }
}
/**
 * Send gold to another player
 * @param {Player|string} receiver - Either a character name or a OtherCharacter Object
 * @param {number} gold - The amount of gold to send
 */
function send_gold(receiver, gold) {
    if (!receiver) return game_log("No receiver sent to send_gold");
    if (receiver.name) receiver = receiver.name;
    parent.socket.emit("send", {name: receiver, gold: gold});
}
/**
 * Send item to another player
 * @param {Player|string} receiver         - Either a character name or a OtherCharacter Object
 * @param {number} num                     - Inventory slot starting from 0
 * @param {number} [quantity=1]            - Quantity
 */
function send_item(receiver, num, quantity) {
    if (!receiver) return game_log("No receiver sent to send_item");
    if (receiver.name) receiver = receiver.name;
    parent.socket.emit("send", {name: receiver, num: num, q: quantity || 1});
}
/**
 * Destroys an item in the num-th Inventory slot
 * @param {number} num - The Inventory slot of the Item [0,41].
 */
function destroy_item(num) // num: 0 to 41
{
    parent.socket.emit("destroy", {num: num});
}
/**
 * Sends a party Invite to another character
 * @param {Player|string} name   - name ca be a player object, a player name, or an id
 * @param {boolean} is_request           - Is requesting to be invited
 */
function send_party_invite(name, is_request) // name could be a player object, name, or id
{
    if (is_object(name)) name = name.name;
    parent.socket.emit('party', {event: is_request && 'request' || 'invite', name: name});
}
/**
 * Request to be invited into a party * @global
 * @param {Player|string} name   - name ca be a player object, a player name, or an id
 */
function send_party_request(name) {
    send_party_invite(name, 1);
}
/**
 * Accept party invite from player * @global
 * @param {string} name
 */
function accept_party_invite(name) {
    parent.socket.emit('party', {event: 'accept', name: name});
}
/**
 * Accept party request from player. * @global
 * @param {string} name
 */
function accept_party_request(name) {
    parent.socket.emit('party', {event: 'raccept', name: name});
}
/**
 * Unfriends a player.
 * @param {string} name - The name of a character or owner ID of the player to unfriend.
 */
function unfriend(name) // instead of a name, an owner id also works, this is currently the only way to unfriend someone [20/08/18]
{
    parent.socket.emit('friend', {event: 'unfriend', name: name});
}
/**
 * Lets the character respawn
 */
function respawn() {
    parent.socket.emit('respawn');
}
/**
 * When a character dies, character.rip is true, you can override handle_death and manually respawn
 * IDEA: A Resident PVP-Dweller, with an evasive Code + irregular respawning
 * NOTE: Add `if(character.rip) {respawn(); return;}` to your main loop/interval too, just in case * @example
 * function handle_death() {
 *   setTimeout(respawn,15000); // respawn current has a 12 second cooldown, best wait 15 seconds before respawning [24/11/16]
 *   return true;
 * }
 */
function handle_death() {
    // When a character dies, character.rip is true, you can override handle_death and manually respawn
    // IDEA: A Resident PVP-Dweller, with an evasive Code + irregular respawning
    // respawn current has a 12 second cooldown, best wait 15 seconds before respawning [24/11/16]
    // setTimeout(respawn,15000);
    // return true;
    // NOTE: Add `if(character.rip) {respawn(); return;}` to your main loop/interval too, just in case
    return -1;
}
/**
 * You can implement your own chat commands with this function. * @global
 * @param command {string}
 * @param args {string}
 * @returns {number}
 */
function handle_command(command, args) // command's are things like "/party" that are entered through Chat - args is a string
{
    // game_log("Command: /"+command+" Args: "+args);
    // return true;
    return -1;
}
/**
 *
 * Send CODE messages to the characters, of course it only works if both characters have CODE active.
 * @global
 * @param {Array|string} to - Either an Array of names or just a name
 * @param {Object} data     - The data to be sent in object form
 */
function send_cm(to, data) {
    // to: Name or Array of Name's
    // data: JSON object
    parent.send_code_message(to, data);
}
/** * @global
 * @param {string} name - Sender of Code Message
 * @param {Object} data - An Object containing the information send
 */
function on_cm(name, data) {
    game_log("Received a code message from: " + name);
}
/**
 * This function gets called whenever an entity disappears * @global
 * @param {Player|Monster} entity
 * @param data
 */
function on_disappear(entity, data) {
    // game_log("disappear: "+entity.id+" "+JSON.stringify(data));
}
/**
 * When multiple characters stay in the same spot, they receive combined damage, this function gets called whenever a monster deals combined damage.
 * Override this function in CODE to react to it * @global
 */
function on_combined_damage() // When multiple characters stay in the same spot, they receive combined damage, this function gets called whenever a monster deals combined damage
{
    // move(character.real_x+5,character.real_y);
}
/**
 * Someone is inviting you to a party * @global
 * @param {string} name - The name of the inviting player
 */
function on_party_invite(name) // called by the inviter's name
{
    // accept_party_invite(name)
}
/**
 * Someone requesting to join your existing party * @global
 * @param {string} name  - The name of the player
 */
function on_party_request(name) // called by the inviter's name - request = someone requesting to join your existing party
{
    // accept_party_request(name)
}
/**
 * Called just before the CODE is destroyed.
 * Can be used to remove event listeners or revert states. * @global
 */
function on_destroy() // called just before the CODE is destroyed
{
    clear_drawings();
    clear_buttons();
}
/**
 * The game calls this function at the best place in each game draw frame, so if you are playing the game at 60fps, this function gets called 60 times per second. * @global
 */
function on_draw() // the game calls this function at the best place in each game draw frame, so if you are playing the game at 60fps, this function gets called 60 times per second
{
}
/**
 * Override this function to listen for game events * @global
 * @callback
 * @param event {Object}
 * @param event.name {string} name of the event e.g. pinkgoo or goblin.
 * @example
 * function on_game_event(event) {
 *     if (event.name == "pinkgoo") {
 *         // start searching for the "Love Goo" of the Valentine's Day event
 *     }
 *     if (event.name == "goblin") {
 *         // start searching for the "Sneaky Goblin"
 *     }
 * }
 */
function on_game_event(event) {
    if (event.name == "pinkgoo") {
        // start searching for the "Love Goo" of the Valentine's Day event
    }
    if (event.name == "goblin") {
        // start searching for the "Sneaky Goblin"
    }
}
var PIXI = parent.PIXI; // for drawing stuff into the game
var drawings = parent.drawings;
var buttons = parent.code_buttons;
/**
 * Documentation: [https://pixijs.github.io/docs/PIXI.Graphics.html]{@link https://pixijs.github.io/docs/PIXI.Graphics.html}
 * keep in mind that drawings could significantly slow redraws, especially if you don't .destroy() them * @global
 * @param x {number}
 * @param y {number}
 * @param x2 {number}
 * @param y2 {number}
 * @param size {number}
 * @param color {color}
 * @returns {PIXI.Graphics} [https://pixijs.github.io/docs/PIXI.Graphics.html]{@link https://pixijs.github.io/docs/PIXI.Graphics.html}
 */
function draw_line(x, y, x2, y2, size, color) {
    // keep in mind that drawings could significantly slow redraws, especially if you don't .destroy() them
    if (!game.graphics) return;
    if (!color) color = 0xF38D00;
    if (!size) size = 1;
    e = new PIXI.Graphics();
    e.lineStyle(size, color);
    e.moveTo(x, y);
    e.lineTo(x2, y2);
    e.endFill();
    parent.drawings.push(e); //for the game to keep track of your drawings
    parent.map.addChild(e); //e.destroy() would remove it, if you draw too many things and leave them there, it will likely bring the game to a halt
    return e;
}
/**
 * Documentation: [https://pixijs.github.io/docs/PIXI.Graphics.html]{@link https://pixijs.github.io/docs/PIXI.Graphics.html}
 * Example: draw_circle(character.real_x,character.real_y,character.range) :) [22/10/16] * @global
 * @param x {number}
 * @param y {number}
 * @param radius {number}
 * @param size {number}
 * @param color {color}
 * @returns {PIXI.Graphics}
 */
// Example: draw_circle(character.real_x,character.real_y,character.range) :) [22/10/16]
function draw_circle(x, y, radius, size, color) {
    if (!game.graphics) return;
    if (!color) color = 0x00F33E;
    if (!size) size = 1;
    e = new PIXI.Graphics();
    e.lineStyle(size, color);
    e.drawCircle(x, y, radius);
    parent.drawings.push(e);
    parent.map.addChild(e);
    return e;
}
/**
 *  Clears drawings added with draw_circle and draw_line functions from the screen. * @global
 */
function clear_drawings() {
    drawings.forEach(function (e) {
        try {
            e.destroy({children: true})
        } catch (ex) {
        }
    });
    drawings = parent.drawings = [];
}
/**
 * Adds a button to the top bar. * @global
 * @param {string} id - the id of the new button
 * @param {string=} value - the text to display
 * @param {function=} fn - the function to run when clicked
 */
function add_top_button(id, value, fn) {
    if (!buttons[id]) {
        buttons[id] = {
            value: value, fn: function () {
            }, place: "top"
        };
        parent.$(".codebuttons").append("<div class='gamebutton codebutton" + id + "' data-id='" + id + "' onclick='code_button_click(this)'>BUTTON</div> ")
    }
    if (fn) set_button_onclick(id, fn)
    if (value) set_button_value(id, value);
}
/**
 * Adds a button to the bottom bar. * @global
 * @param {string} id - the id of the new button
 * @param {string=} value - the text to display
 * @param {function=} fn - the function to run when clicked
 */
function add_bottom_button(id, value, fn) {
    if (!buttons[id]) {
        buttons[id] = {
            value: value, fn: function () {
            }, place: "bottom"
        };
        parent.$(".codebbuttons").append("<div class='gamebutton gamebutton-small codebutton" + id + "' data-id='" + id + "' onclick='code_button_click(this)'>BUTTON</div> ")
    }
    if (fn) set_button_onclick(id, fn)
    if (value) set_button_value(id, value);
}
/**
 * Sets the displayed text of a button. * @global
 * @param {string} id - the button to modify
 * @param {string} value - the text to display
 */
function set_button_value(id, value) {
    parent.$(".codebutton" + id).html(value);
}
/**
 * Sets a function to run when clicked. * @global
 * @param {string} id - the button to modify
 * @param {string} color - the colour to set the button to
 * @example
 *
 * set_button_color("myButton", "#FFFFFF"); // sets myButton to white
 */
function set_button_color(id, color) {
    parent.$(".codebutton" + id).css("border-color", color);
}
/**
 * Sets a function to run when clicked. * @global
 * @param {string} id - the button to modify
 * @param {function} fn - the function to run
 */
function set_button_onclick(id, fn) {
    buttons[id].fn = fn;
}
/**
 * Strips all the buttons of their HTML and data. * @global
 */
function clear_buttons() {
    parent.$('.codebuttons').html("");
    parent.$('.codebbuttons').html("");
    buttons = parent.code_buttons = {};
}
/**
 * Configures the game to auto reload in case you disconnect due to rare network issues. (FIXME: Document differences of "on" and "auto") * @global
 * @param {string} value - valid values are "on", "off", and "auto"
 */
function auto_reload(value) {
    // Configures the game to auto reload in case you disconnect due to rare network issues
    if (value === false) parent.auto_reload = "off";
    else if (value == "auto") parent.auto_reload = "auto"; // code or merchant stand
    else parent.auto_reload = "on"; // always reload
}
game.listeners = [];
/**
 * Adds a listener that's called whenever the client recieves an event of any kind.
 * @alias game.all
 * @memberof game
 * @param {function} f - A function that's called whenever an event is recieved.
 * @return {string} The resulting ID of the listener.
 */
game.all = function (f) {
    var def = {f: f, id: randomStr(30), event: "all"};
    game.listeners.push(def);
    return def.id;
};
/**
 * Adds a listener that's called whenever the client recieves a specific event.
 * @alias game.on
 * @memberof game
 * @param {string} event - The event that should trigger the function.
 * @param {function} f   - A function that's called whenever the specified event is recieved.
 * @return {string} The resulting ID of the listener.
 */
game.on = function (event, f) {
    var def = {f: f, id: randomStr(30), event: event};
    game.listeners.push(def);
    return def.id;
};
/**
 * Adds a listener that's called just once whenever the client recieves a specific event.
 * @alias game.once
 * @memberof game
 * @param {string} event - The event that should trigger the function.
 * @param {function} f   - A function that's called whenever the specified event is recieved.
 * @return {string} The resulting ID of the listener.
 */
game.once = function (event, f) {
    var def = {f: f, id: randomStr(30), event: event, once: true};
    game.listeners.push(def);
    return def.id;
};
/**
 * Removes a listener from the listeners array.
 * @alias game.remove
 * @memberof game
 * @param {string} id - The ID of the listener to remove.
 */
game.remove = function (id) {
    for (var i = 0; i < game.listeners.length; i++) {
        if (game.listeners[i].id == id) {
            game.listeners.splice(i, 1);
            break;
        }
    }
};
/**
 * Triggers a specified event, triggering any related listeners.
 * @alias game.trigger
 * @memberof game
 * @param {string} event - The event to trigger.
 * @param {...*} args    - The arguments to pass to the related listeners.
 */
game.trigger = function (event, args) {
    var to_delete = [];
    for (var i = 0; i < game.listeners.length; i++) {
        var l = game.listeners[i];
        if (l.event == event || l.event == "all") {
            try {
                if (l.event == "all") l.f(event, args)
                else l.f(args, event);
            } catch (e) {
                game_log("Listener Exception (" + l.event + ") " + e, code_color);
            }
            if (l.once || l.f && l.f.delete) to_delete.push(l.id);
        }
    }
    // game_log(to_delete);
};
/**
 *
 * @global
 * @param {string} name
 * @param {*} data
 */
function trigger_event(name, data) {
    game.trigger(name, data);
}
/**
 * Pops up a window showing what an item would look like with the specified parameters. (FIXME: Document arguments better, example) * @global
 * @param {string} def - The item's id.
 * @param {Object} args - The item's data.
 */
function preview_item(def, args) {
    //PLANNED Improvements:
    //- Importing a custom thumbnail
    //- Drafting custom item abilities
    // Email me or create an issue if you need these features (if you want to suggest new items) [20/03/17]
    if (!args) args = {};
    var html = "";
    var styles = "vertical-align: top; margin: 10px";
    var name = def.id || args.id || "staff";
    parent.prop_cache = {}; // bust the item cache
    if (def.compound || def.upgrade) {
        for (var level = 0; level <= 10; level++)
            html += parent.render_item("html", {
                item: def,
                name: name,
                styles: styles,
                actual: {name: name, level: level},
                sell: true,
                thumbnail: args.thumbnail
            });
    } else {
        html += parent.render_item("html", {item: def, name: name, thumbnail: args.thumbnail});
    }
    html += "<div style='margin: 10px; border: 5px solid gray; padding: 4px'>" + parent.json_to_html(def) + "</div>";
    parent.show_modal(html);
    parent.prop_cache = {};
}
/**
 * Replaces your skillbar keys. * @global
 * @param {(...string|string[])} arguments - The keys to bind.
 * @example
 * 
 * set_skillbar("1","2","3","4","R");
 * set_skillbar(["1","2","3","4","R"]);
 * 
 */
function set_skillbar() // example: set_skillbar("1","2","3","4","R") or set_skillbar(["1","2","3","4","R"])
{
    var arr = ["1"];
    if (is_array(arguments[0])) arr = arguments[0];
    else {
        arr = [];
        for (var i = 0; i < arguments.length; i++) arr.push(arguments[i]);
    }
    parent.set_setting(parent.real_id, "skillbar", arr);
    parent.skillbar = arr;
    parent.render_skills();
    parent.render_skills();
}
/**
 * Replaces your current keymap with "keymap". * @global
 * @param {(Object.<string, Object.<string, string>>|Object.<string, {code: string, name: string}>)} keymap - A dictionary of keys to map.
 * @example
 * 
 * set_keymap({"1":{"name":"use_mp"},"2":{"name":"use_hp"}}); // Set key 1 to use health potion, and key 2 to use mana potion.
 * set_keymap({"1":{name: "snippet", code: "say('OMG')"}}); // Set key 1 to say "OMG".
 *
 * // Set key 1 to use health potion, and key 2 to say "OMG".
 * var skillkey = {"name":"use_mp"};
 * var codekey = {name: "snippet", code: "say('OMG')"};
 * set_keymap({"1": skillkey, "2": codekey});
 * 
 */
function set_keymap(keymap) // example: {"1":{"name":"use_mp"},"2":{"name":"use_hp"}}
{
    parent.set_setting(parent.real_id, "keymap", keymap);
    parent.keymap = keymap;
    parent.render_skills();
    parent.render_skills();
}
/**
 * Maps a skill or code to key. * @global
 * @param {string} key - The key which will be bound.
 * @param {string} skill - The skill to bind to the key.
 * @param {string=} code - The code to bind to the key (overrides skill).
 * @example
 *
 * map_key("1","use_hp");
 * map_key("2","snippet","say('OMG')");
 * map_key("1","esc");
 * map_key("ESC","up");
 */
function map_key(key, skill, code) // example: map_key("1","use_hp") or map_key("2","snippet","say('OMG')") or map_key("1","esc") or map_key("ESC","up")
{
    var settings = parent.get_settings(parent.real_id);
    var keymap = settings.keymap || parent.keymap;
    if (is_string(skill)) keymap[key] = {"name": skill};
    else keymap[key] = skill;
    if (code) keymap[key].code = code;
    if (keymap[key].keycode) parent.K[keymap[key].keycode] = key;
    set_keymap(keymap);
}
/**
 * Removes a mapping from a key. * @global
 * @param {string} key - The key which will have it's binding removed.
 * @example
 *
 *     unmap_key('1');
 */
function unmap_key(key) {
    var settings = parent.get_settings(parent.real_id);
    var keymap = settings.keymap || parent.keymap;
    delete keymap[key];
    set_keymap(keymap);
}
/**
 * Resets your key mappings. * @global
 */
function reset_mappings() {
    parent.keymap = {};
    parent.skillbar = [];
    parent.map_keys_and_skills();
    set_keymap(parent.keymap);
    set_skillbar(parent.skillbar);
}
/**
 * Saves data into local storage. * @global
 * @param {string} name - The name of the data store.
 * @param {*} value - The data to store.
 * @return {*} Returns from "parent.storage_set(name, value)" (FIXME, define return value)
 */
function pset(name, value) {
    // on Web, window.localStorage is used, on Steam/Mac, the electron-store package is used for persistent storage
    return parent.storage_set(name, value);
}
/**
 * Retrieves data from local storage. * @global
 * @param {string} name - The name of the data store.
 * @return {*} The data stored in "name".
 */
function pget(name) {
    // on Web, window.localStorage is used, on Steam/Mac, the electron-store package is used for persistent storage
    return parent.storage_get(name);
}
/**
 * Loads saved code with the specified name into CODE.
 * @global
 * @param {string} name
 * @param {function} onerror -  A function that gets executed when the code errors
 */
function load_code(name, onerror) // onerror can be a function that will be executed if load_code fails
{
    if (!onerror) onerror = function () {
        game_log("load_code: Failed to load", "#E13758");
    }
    var xhrObj = new XMLHttpRequest();
    xhrObj.open('GET', "/code.js?name=" + encodeURIComponent(name) + "&timestamp=" + (new Date().getTime()), false);
    xhrObj.send('');
    var library = document.createElement("script");
    library.type = "text/javascript";
    library.text = xhrObj.responseText;
    library.onerror = onerror;
    document.getElementsByTagName("head")[0].appendChild(library);
}
var smart = {
    moving: false,
    map: "main", x: 0, y: 0,
    on_done: function () {
    },
    plot: null,
    edge: 20,
    use_town: false,
    prune: {
        smooth: true,
        map: true,
    },
    flags: {}
};
/**
 * Uses a Breadth-first search path finding algorithm to find the shortest path
 * despite the name, smart_move isn't very smart or efficient, it's up to the players to
 * implement a better movement method. * @global
 * @param {Object} destination
 * @param {string} destination.to - Can be of multiple values.
 *      If destination.to is a monster name we will find where they spawn and set the target destination.
 *      Monsters like the phoenix or mvampire have random spawn locations we want to check for the accordingly
 *      Every time we search for the phoenix we will try a different location so if nobody kill it we will eventually find it
 *      If destination to is one of "upgrade", "exchange", "potions", "scrolls" we will find the path to the closest shop that sells the items.
 * @param {string} destination.map -  Destination map
 * @param {number} destination.x - Destination coordinates
 * @param {number} destination.y - Destination coordinates
 * @param {function} on_done -  Function that gets executed once the path finding finishes.
 */
function smart_move(destination, on_done) // despite the name, smart_move isn't very smart or efficient, it's up to the players to implement a better movement method [05/02/17]
{
    smart.map = "";
    if (is_string(destination)) destination = {to: destination};
    if (is_number(destination)) destination = {x: destination, y: on_done}, on_done = null;
    if ("x" in destination) {
        smart.map = destination.map || character.map;
        smart.x = destination.x;
        smart.y = destination.y;
    } else if ("to" in destination || "map" in destination) {
        if (destination.to == "town") destination.to = "main";
        if (G.monsters[destination.to]) {
            for (var name in G.maps)
                (G.maps[name].monsters || []).forEach(function (pack) {
                    if (pack.type != destination.to || G.maps[name].ignore || G.maps[name].instance) return;
                    if (pack.boundaries) // boundaries: for phoenix, mvampire
                    {
                        pack.last = pack.last || 0;
                        var boundary = pack.boundaries[pack.last % pack.boundaries.length];
                        pack.last++;
                        smart.map = boundary[0];
                        smart.x = (boundary[1] + boundary[3]) / 2;
                        smart.y = (boundary[2] + boundary[4]) / 2;
                    } else if (pack.boundary) {
                        var boundary = pack.boundary;
                        smart.map = name;
                        smart.x = (boundary[0] + boundary[2]) / 2;
                        smart.y = (boundary[1] + boundary[3]) / 2;
                    }
                });
        } else if (G.maps[destination.to || destination.map]) {
            smart.map = destination.to || destination.map;
            smart.x = G.maps[smart.map].spawns[0][0];
            smart.y = G.maps[smart.map].spawns[0][1];
        } else if (destination.to == "upgrade" || destination.to == "compound") smart.map = "main", smart.x = -204, smart.y = -129;
        else if (destination.to == "exchange") smart.map = "main", smart.x = -26, smart.y = -432;
        else if (destination.to == "potions" && character.map == "halloween") smart.map = "halloween", smart.x = 149, smart.y = -182;
        else if (destination.to == "potions" && in_arr(character.map, ["winterland", "winter_inn", "winter_cave"])) smart.map = "winter_inn", smart.x = -84, smart.y = -173;
        else if (destination.to == "potions") smart.map = "main", smart.x = 56, smart.y = -122;
        else if (destination.to == "scrolls") smart.map = "main", smart.x = -465, smart.y = -71;
    }
    if (!smart.map) {
        game_log("Unrecognized", "#CF5B5B");
        return;
    }
    smart.moving = true;
    smart.plot = [];
    smart.flags = {};
    smart.searching = smart.found = false;
    if (destination.return) {
        var cx = character.real_x, cy = character.real_y, cmap = character.map;
        smart.on_done = function () {
            if (on_done) on_done();
            smart_move({map: cmap, x: cx, y: cy});
        }
    } else smart.on_done = on_done || function () {
    };
    console.log(smart.map + " " + smart.x + " " + smart.y);
}
/**
 * Stop path finding and moving * @global
 */
function stop(action) {
    if (!action || action == "move") {
        if (smart.moving) smart.on_done(false);
        smart.moving = false;
        move(character.real_x, character.real_y);
    } else if (action == "invis") {
        parent.socket.emit("stop", {action: "invis"});
    } else if (action == "teleport") {
        parent.socket.emit("stop", {action: "teleport"});
    }
}
var queue = [], visited = {}, start = 0, best = null;
var moves = [[0, 15], [0, -15], [15, 0], [-15, 0]];
/** * @global
 * @param {number} index
 */
function plot(index) {
    if (index == -1) return;
    plot(queue[index].i); // Recursively back-tracks the path we came from
    smart.plot.push(queue[index]);
}
/** * @global
 * @param node
 */
function qpush(node) {
    // If we haven't visited this location, adds the location to the queue
    if (smart.prune.map && smart.flags.map && node.map != smart.map) return;
    if (visited[node.map + "-" + node.x + "-" + node.y]) return;
    if (!node.i) node.i = start; // set the index, to aid the plot function
    queue.push(node);
    visited[node.map + "-" + node.x + "-" + node.y] = true;
}
/**
 * Internal smart_move function
 * Assume the path ahead is [i] [i+1] [i+2] - This routine checks whether [i+1] could be skipped
 * The resulting path is smooth rather than rectangular and bumpy
 * Try adding "function smooth_path(){}" or "smart.prune.smooth=false;" to your Code * @global
 */
function smooth_path() {
    var i = 0, j;
    while (i < smart.plot.length) {
        // Assume the path ahead is [i] [i+1] [i+2] - This routine checks whether [i+1] could be skipped
        // The resulting path is smooth rather than rectangular and bumpy
        // Try adding "function smooth_path(){}" or "smart.prune.smooth=false;" to your Code
        // [06/07/18]: (!smart.plot[i+2] || !smart.plot[i+2].transport) - without this condition, in "winterland", move(-160,-660), smart_move("main") fails
        while (i + 2 < smart.plot.length && smart.plot[i].map == smart.plot[i + 1].map && smart.plot[i].map == smart.plot[i + 1].map && (!smart.plot[i + 2] || !smart.plot[i + 2].transport) &&
        can_move({
            map: smart.plot[i].map,
            x: smart.plot[i].x,
            y: smart.plot[i].y,
            going_x: smart.plot[i + 2].x,
            going_y: smart.plot[i + 2].y,
            base: character.base
        }))
            smart.plot.splice(i + 1, 1);
        i++;
    }
}
function bfs() {
    var timer = new Date(), result = null, optimal = true;
    while (start < queue.length) {
        var current = queue[start];
        var map = G.maps[current.map];
        if (current.map == smart.map) {
            smart.flags.map = true;
            if (abs(current.x - smart.x) + abs(current.y - smart.y) < smart.edge) {
                result = start;
                break;
            } else if (best === null || abs(current.x - smart.x) + abs(current.y - smart.y) < abs(queue[best].x - smart.x) + abs(queue[best].y - smart.y)) {
                best = start;
            }
        } else if (current.map != smart.map) {
            if (smart.prune.map && smart.flags.map) {
                start++;
                continue;
            }
            map.doors.forEach(function (door) {
                // if(simple_distance({x:map.spawns[door[6]][0],y:map.spawns[door[6]][1]},{x:current.x,y:current.y})<30)
                if (is_door_close(current.map, door, current.x, current.y) && can_use_door(current.map, door, current.x, current.y))
                    qpush({
                        map: door[4],
                        x: G.maps[door[4]].spawns[door[5] || 0][0],
                        y: G.maps[door[4]].spawns[door[5] || 0][1],
                        transport: true,
                        s: door[5] || 0
                    });
            });
            map.npcs.forEach(function (npc) {
                if (npc.id == "transporter" && simple_distance({x: npc.position[0], y: npc.position[1]}, {
                    x: current.x,
                    y: current.y
                }) < 75) {
                    for (var place in G.npcs.transporter.places) {
                        qpush({
                            map: place,
                            x: G.maps[place].spawns[G.npcs.transporter.places[place]][0],
                            y: G.maps[place].spawns[G.npcs.transporter.places[place]][1],
                            transport: true,
                            s: G.npcs.transporter.places[place]
                        });
                    }
                }
            });
        }
        if (smart.use_town) qpush({map: current.map, x: map.spawns[0][0], y: map.spawns[0][1], town: true}); // "town"
        shuffle(moves);
        moves.forEach(function (m) {
            var new_x = parseInt(current.x + m[0]), new_y = parseInt(current.y + m[1]);
            // utilise can_move - game itself uses can_move too - smart_move is slow as can_move checks all the lines at each step
            if (can_move({
                map: current.map,
                x: current.x,
                y: current.y,
                going_x: new_x,
                going_y: new_y,
                base: character.base
            }))
                qpush({map: current.map, x: new_x, y: new_y});
        });
        start++;
        if (mssince(timer) > (!parent.is_hidden() && 40 || 500)) return;
    }
    if (result === null) result = best, optimal = false;
    if (result === null) {
        game_log("Path not found!", "#CF575F");
        smart.moving = false;
        smart.on_done(false);
    } else {
        plot(result);
        smart.found = true;
        if (smart.prune.smooth) smooth_path();
        if (optimal) game_log("Path found!", "#C882D1");
        else game_log("Path found~", "#C882D1");
        // game_log(queue.length);
        parent.d_text("Yes!", character, {color: "#58D685"});
    }
}
/**
 * Internal smart_move function * @global
 */
function start_pathfinding() {
    smart.searching = true;
    queue = [], visited = {}, start = 0, best = null;
    qpush({x: character.real_x, y: character.real_y, map: character.map, i: -1});
    game_log("Searching for a path...", "#89D4A2");
    bfs();
}
/**
 * Internal smart_move function * @global
 */
function continue_pathfinding() {
    bfs();
}
/**
 * Internal smart_move function * @global
 */
function smart_move_logic() {
    if (!smart.moving) return;
    if (!smart.searching && !smart.found) {
        start_pathfinding();
    } else if (!smart.found) {
        if (Math.random() < 0.1) {
            move(character.real_x + Math.random() * 0.0002 - 0.0001, character.real_y + Math.random() * 0.0002 - 0.0001);
            parent.d_text(shuffle(["Hmm", "...", "???", "Definitely left", "No right!", "Is it?", "I can do this!", "I think ...", "What If", "Should be", "I'm Sure", "Nope", "Wait a min!", "Oh my"])[0], character, {color: shuffle(["#68B3D1", "#D06F99", "#6ED5A3", "#D2CF5A"])[0]});
        }
        continue_pathfinding();
    } else if (!character.moving && can_walk(character) && !is_transporting(character)) {
        if (!smart.plot.length) {
            smart.moving = false;
            smart.on_done(true);
            return;
        }
        var current = smart.plot[0];
        smart.plot.splice(0, 1);
        // game_log(JSON.stringify(current));
        if (current.town) {
            use("town");
        } else if (current.transport) {
            parent.socket.emit("transport", {to: current.map, s: current.s});
            // use("transporter",current.map);
        } else if (character.map == current.map && can_move_to(current.x, current.y)) {
            move(current.x, current.y);
        } else {
            game_log("Lost the path...", "#CF5B5B");
            smart_move({map: smart.map, x: smart.x, y: smart.y}, smart.on_done);
        }
    }
}
setInterval(function () {
    smart_move_logic();
}, 80);
function proxy(name) {
    if (in_arr(name, character.properties)) return;
    character.properties.push(name);
    Object.defineProperty(character, name, {
        get: function () {
            return parent.character[name];
        }, set: function (value) {
            delete this[name];
            parent.character[name] = value;
        }
    });
}
["bank", "user", "code", "angle", "direction", "target", "from_x", "from_y", "going_x", "going_y", "moving", "vx", "vy", "move_num"].forEach(function (p) {
    proxy(p)
});
setInterval(function () {
    for (var p in parent.character) proxy(p);
}, 50); // bottom of the barrel
function eval_s(code) // this is how snippets are eval'ed if they include "output="/"json_output=" - so if they include these, the scope of eval isn't global - doesn't matter much [13/07/18]
{
    var output = undefined, json_output = undefined;
    eval(code);
    if (output !== undefined) parent.show_modal("<pre>" + output + "</pre>");
    if (json_output !== undefined) parent.show_json(json_output);
}
function performance_trick() {
    parent.performance_trick(); // Just plays an empty sound file, so browsers don't throttle JS, only way to prevent it, interesting cheat [05/07/18]
    // Lately Chrome has been screwing things up with every update, mostly it's bugs and performance issues, but this time, the way Audio is played has been changed, so, once the game refreshes itself, the tabs need to be manually focused once for performance_trick() to become effective, as Audio can no longer automatically play [21/10/18]
}
function doneify(fn, s_event, f_event) {
    return function (a, b, c, d, e, f) {
        var rxd = randomStr(30);
        parent.rxd = rxd;
        fn(a, b, c, d, e, f);
        return {
            done: function (callback) {
                game.once(s_event, function (event) {
                    if (event.rxd == rxd) {
                        callback(true, event);
                        this.delete = true; // remove the .on listener
                        parent.rxd = null;
                    }
                    // else game_log("rxd_mismatch");
                });
                game.once(f_event, function (event) {
                    if (event.rxd == rxd) {
                        callback(false, event);
                        this.delete = true; // remove the .on listener
                        parent.rxd = null;
                    }
                    // else game_log("rxd_mismatch");
                });
            }
        };
    };
}
buy = doneify(buy, "buy_success", "buy_fail");
//safety flags
var last_loot = new Date(0);
var last_attack = new Date(0);
var last_potion = new Date(0);
var last_transport = new Date(0);
var last_message = "", current_message = "";
function code_draw() {
    if (last_message != current_message) $("#gg").html(current_message), last_message = current_message;
    requestAnimationFrame(code_draw);
}
code_draw();