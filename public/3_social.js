import User from "./User.js";
import EditableText from "./EditableText.js";
import DynamicList from "./DynamicList.js";

class App {
  constructor() {
    this._user = null;

    this._loginForm = null;
    this._postForm = null;

    this._onListUsers = this._onListUsers.bind(this);
    this._onLogin = this._onLogin.bind(this);
    this._updateName = this._updateName.bind(this);
    this._updateAvatar = this._updateAvatar.bind(this);
    this._onfollow = this._onfollow.bind(this);
    this._onUnfollow = this._onUnfollow.bind(this);
    this._onpostClick = this._onpostClick.bind(this);

    //TODO: Add instance variables, bind event handlers, etc.
    this._nameContainer = null;
    this._avatarContainer = null;
    this._idContainer = null;
    let self = this;

  }

  setup() {
    this._loginForm = document.querySelector("#loginForm");
    this._loginForm.login.addEventListener("click", this._onLogin);
    this._loginForm.listUsers.addEventListener("click", this._onListUsers);

    this._postForm = document.querySelector("#postForm");

    this._postForm.querySelector("#postButton").addEventListener("click", this._onpostClick);

    this._nameContainer = new EditableText("nameInput");
    this._nameContainer.addToDOM(document.querySelector("#nameContainer"), this._updateName);
    this._avatarContainer = new EditableText ("avatarInput");
    this._avatarContainer.addToDOM(document.querySelector("#avatarContainer"), this._updateAvatar);
    this._listContainer = new DynamicList("Search for an event");
    this._listContainer.addToDOM(document.querySelector("#eventContainer2"));
    this._listContainer = new DynamicList("Enter friend's name here");
    this._listContainer.addToDOM(document.querySelector("#eventContainer"), this._onfollow, this._onUnfollow);


  }

  _getAvatar(user) {
    let url = user.avatarURL;
    if (!url) url = "images/default.png";
    return url;
  }

  _displayPost(post) {
    let node = document.querySelector("#templatePost").cloneNode(true);
    node.id = "";

    let avatar = node.querySelector(".avatar");
    avatar.src = this._getAvatar(post.user);
    avatar.alt = `${post.user.name}'s avatar`;

    node.querySelector(".name").textContent = post.user.name;
    node.querySelector(".userid").textContent = post.user.id;
    node.querySelector(".time").textContent = post.time.toLocaleString();
    node.querySelector(".text").textContent = post.text;

    document.querySelector("#feed").appendChild(node);
  }


  async _loadProfile() {
    document.querySelector("#welcome").classList.add("hidden");
    document.querySelector("#main").classList.remove("hidden");
    document.querySelector("#idContainer").textContent = this._user.id;
    /* Reset the feed */
    document.querySelector("#feed").textContent = "";

    /* Update the avatar, name, and user ID in the new post form */
    this._postForm.querySelector(".avatar").src = this._getAvatar(this._user);
    this._postForm.querySelector(".name").textContent = this._user.name;
    this._postForm.querySelector(".userid").textContent = this._user.id;

    //TODO: Update the sidebar and load the feed
    this._nameContainer.setValue(this._user.name);
    this._avatarContainer.setValue(this._user.avatarURL);
    this._listContainer.setList(this._user.following);
    let posts = await this._user.getFeed();
    for (let post of posts ){
      this._displayPost(post);
    }
  }

  /*** Event Handlers ***/

  async _onListUsers() {
    let users = await User.listUsers();
    let usersStr = users.join("\n");
    alert(`List of users:\n\n${usersStr}`);
  }

  async _onLogin(event) {
    event.preventDefault();
    let userid = this._loginForm.userid.value;
    this._user = await User.loadOrCreate(userid);
    this._loadProfile();
  }
  async _updateName(editableText){
    this._user.name = editableText.value;
    await this._user.save();
    await this._loadProfile();
  }
  async _updateAvatar(editableText){
    this._user.avatarURL = editableText.value;
    await this._user.save();
    await this._loadProfile();
  }

  async _onfollow(id){
    await this._user.addFollow(id);
    this._loadProfile();
  }
  async _onUnfollow(id){
    await this._user.deleteFollow(id);
    this._loadProfile();
  }
  async _onpostClick(){
    event.preventDefault();
    let text = this._postForm.querySelector("#newPost").value;
    await this._user.makePost(text);
    this._loadProfile();
  }
}

let app = new App();
app.setup();
