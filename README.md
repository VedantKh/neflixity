# Movie Search API

A Flask-based API that provides semantic search capabilities for movies using OpenAI embeddings.
Inherits from [Suflix repo](https://github.com/VedantKh/suflix), made a new github repo since I refactored the codebase into client and server to accommodate for a Flask backend.

Data accessed from [TMDb](https://www.themoviedb.org/) in accordance with their T&Cs.

## TODO

### Data Quality
- [ ] Filter out movies with vote_count below 50 
- [ ] Filter out movies with popularity below 1
- [ ] Make movies_metadata.csv hold only 12 top searches for home page
- [ ] Check existing function to see if keywords were actually embedded


### UI/UX Improvements
- [ ] Fix MovieModal responsiveness in mobile view
- [ ] Add Search button
- [ ] Implement typewriter animation for example prompts
- [ ] Display post-hoc generation using RAG
- [ ] Add animations

### Testing
- [ ] Conduct stress testing