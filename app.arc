@app
ceramic-blog-4403

@http
/*
  method any
  src server

@ws

@static

@tables
user
  pk *String

password
  pk *String # userId

note
  pk *String  # userId
  sk **String # noteId
