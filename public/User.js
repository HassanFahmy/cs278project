import apiRequest from "./api.js";

/* A small class to represent a Post */
export class Post {
  constructor(data) {
    this.user = data.user;
    this.time = new Date(data.time);
    this.text = data.text;
  }
}

export default class User {
  /* Returns an array of user IDs */
  static async listUsers() {
    let [status, data] = await apiRequest("GET", "/users");
    if (status !== 200) throw new Error("Couldn't get list of users");
    return data.users;
  }

  /* Returns a User object, creating hte user if necessary */
  static async loadOrCreate(id) {
    let [status, user] = await apiRequest("GET", "/users/"+id);
    if (status === 404){
      let temp = {id:id};
      [status, user] = await apiRequest("POST", "/users" , temp );
    }
    let obj = new User(user);
    return obj;
  }

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.avatarURL = data.avatarURL;
    this.following = data.following;
  }

  async save() {
    await apiRequest("PATCH", "/users/"+this.id, {id:this.id, name:this.name, avatarURL:this.avatarURL});
  }

  /* Returns an array of Post objects */
  async getFeed() {
    let [status,feed] = await apiRequest("GET", "/users/"+this.id+"/feed");
    let ret = [];
    for (let post of feed.posts){
      ret.push(new Post(post));
    }
    return ret;
  }

  async makePost(text) {
    await apiRequest("POST" , "/users/"+this.id + "/posts", {text: text})
  }

  async addFollow(id) {
    let status = await apiRequest( "POST" , "/users/"+this.id + "/follow", {target:id});
    if ( status[0] !== 400){
      this.following.push(id);
    }
  }

  async deleteFollow(id) {
    for( var i = 0; i < this.following.length; i++){
      if ( this.following[i] === id) {
        this.following.splice(i, 1);
        break;
      }
    }
    await apiRequest( "DELETE" , "/users/"+this.id + "/follow", {target:id});
  }
}
