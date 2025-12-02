# Quizzy

A fun QuizUp reboot MVP with offline and multiplayer mode built using Next.js and Typescript.
It was fun to implement an app I used to play all the time with my friends when I was younger, QuizUp was a really fun game that allowed you to test your knowledge on your favourite topics.
It was my first exposure to websockets which as a first impression I can only describe as feeling like organising an orchestra but with computers instead of musicians.

# Core Features

Quiz list:
A list of available quizzes are read and displayed in the main page. They are read from a json file. You can add a quiz by adding an entry to the json file (this part would probably move to a NoSql database if scaled)

Offline:
A simple quiz played solo. Answer a multi-choice question under the time limit to score points

Multiplayer:
2 players face each other in a fast paced quiz duel where the first to answer correctly gets the points. If you know the answer but are too slow, you will lose the round. This copies the game mechanics from the discontinued phone app "QuizUp" released in 2013 which used to be extremely popular.

# Tech Stack

I used Next.js to code the frontend, and I have the game logic in an API coded with Express.js using Typescript. I used the SocketIO library to implement websockets for the multiplayer mode. I deployed the frontend on vercel, since it's easy to deploy with Next.js. I deployed the API on Render, with perhaps an eventual redeployment to AWS to practice devops (and avoid the free cold start tiers).

# Future Improvements

Since QuizUp there has been a few alternatives, but none have managed to scratch the itch the first app did. There are so many ways to scale this app and potentially turn it into a real user facing application. Here are some high level features that could be added:

- User profiles: A profile system which tracks match history, friends system, statistics and customisable avatars
- Quiz Creation: A UI tool to allow users to create quizzes. Perhaps use a voting system or a simple algorithm to rank the most popular user made quizzes
- Leaderboards: Each quiz could have leaderboards to track the best players. A global leaderboard or simple ranking system could track players that are widely good at quizzes too, to build up competition
- More game modes: There's multiple game modes I could add. Team quiz match (maybe 2v2 or a bit like the uk tv show "University Challenge), handmade offline quiz rush, AI Quiz and more

