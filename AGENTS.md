# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.


Snipr AI — Detailed Product Description
Overview

Snipr AI is an offline-first mobile application designed specifically for developers to store, organize, search, manage, and sync reusable code snippets and development resources directly from their mobile device. The application combines local-first architecture, intelligent AI-powered tooling, cloud synchronization, and advanced search capabilities into a single developer utility platform.

The app is built to function seamlessly without an internet connection while still providing optional online synchronization through Turso whenever connectivity becomes available. Snipr AI acts as a personal developer knowledge base where users can save frequently used code, organize technical resources, manage local development files, scan code from screenshots, and leverage AI to understand or improve snippets.

The primary goal of the application is to provide developers with a lightweight yet powerful mobile coding companion that improves productivity, accelerates development workflows, and ensures important code snippets remain accessible anytime and anywhere.

Problem Statement

Developers frequently reuse boilerplate code, utility functions, API integrations, configuration files, and debugging snippets across multiple projects. Existing note-taking or snippet management tools often rely heavily on internet connectivity, lack proper offline support, provide limited organization capabilities, or fail to integrate intelligent AI-powered developer assistance.

Additionally, developers commonly encounter useful code snippets on platforms such as:

YouTube tutorials
Technical blogs
Documentation
PDFs
Social media
Screenshots
Online forums

but lack a fast and organized method to store and retrieve this information efficiently on mobile devices.

Snipr AI addresses these issues by offering:

complete offline functionality
intelligent semantic search
AI-powered code explanations
OCR-based code extraction
cloud synchronization
local file management
export and sharing utilities

within a single unified mobile application.

Objectives

The main objectives of the project are:

Build a fully offline-capable developer utility application
Provide efficient local storage and retrieval of code snippets
Enable seamless synchronization with a cloud database using Turso
Integrate AI-powered developer assistance for code understanding
Implement semantic search for intelligent snippet discovery
Support OCR-based extraction of code from screenshots/images
Provide file management and export functionality
Deliver a clean, scalable, and production-ready mobile architecture
Core Features
1. Snippet Management System

The application allows users to create and manage reusable code snippets efficiently.

Each snippet contains:

Title
Code content
Programming language
Tags/categories
Favorite status
Creation and modification timestamps

Users can:

Create snippets
Edit snippets
Delete snippets
Search snippets
Mark snippets as favorites
Organize snippets using tags
View detailed snippet information

The app supports snippets for multiple programming languages including:

JavaScript
TypeScript
Python
Java
Dart
C++
SQL
JSON
and more
2. Offline-First Architecture

One of the primary features of Snipr AI is complete offline usability.

The application stores all essential data locally using SQLite, ensuring users can:

Access snippets offline
Create new snippets offline
Edit snippets offline
Search snippets offline
Manage files offline

without requiring internet connectivity.

The offline-first approach improves:

reliability
speed
user experience
accessibility

especially in low-network environments.

3. Turso Cloud Synchronization

To support multi-device access and backup capabilities, the application integrates Turso as a cloud database layer.

When the user regains internet connectivity, the app synchronizes local data with the Turso database automatically.

Synchronization capabilities include:

Uploading new snippets
Updating edited snippets
Syncing favorites/tags
Downloading cloud changes
Conflict handling
Incremental sync operations

This hybrid architecture combines:

local SQLite storage
cloud persistence
offline-first performance

to create a scalable and modern mobile data system.

4. AI-Powered Code Explanation

The application integrates AI APIs to provide intelligent assistance for saved code snippets.

Users can select any snippet and generate:

Code explanations
Logic breakdowns
Summaries
Improvement suggestions
Optimization recommendations

Example use cases:

Understanding old code
Learning unfamiliar syntax
Debugging logic
Improving readability
Refactoring snippets

This transforms the application from a simple storage utility into an intelligent developer assistant.

5. Semantic Search (AI Search)

Snipr AI includes AI-powered semantic search functionality.

Unlike traditional keyword-based search systems, semantic search allows users to search snippets using natural language queries.

Example searches:

“Show my JWT authentication code”
“Find debounce logic for React”
“Search for API middleware snippets”

Even if exact keywords are not present in the snippet title, the application can still retrieve relevant results using vector embeddings and similarity matching.

This feature significantly improves snippet discoverability and provides a modern AI-driven user experience.

6. OCR Code Scanner

The application supports OCR (Optical Character Recognition) functionality for extracting code directly from screenshots or images.

Users can:

Upload screenshots
Capture images
Scan code from tutorials/books/videos
Convert detected text into editable snippets

The extracted code can then be:

Saved locally
Organized with tags
Edited
Exported
Synced to cloud storage

This feature improves productivity and makes mobile snippet collection significantly easier.

7. File Management System

The app includes local file management capabilities using Expo FileSystem.

Users can:

Attach screenshots
Save code files
Download templates/resources
Manage local files and folders
Export snippets
Delete unused files

Supported file operations include:

Create
Read
Write
Move
Copy
Delete
Download

Supported export formats:

.txt
.js
.json
.ts
8. Export and Sharing System

Users can export snippets as files and share them directly through the mobile device.

Sharing capabilities include:

WhatsApp
Email
Telegram
Discord
File transfer
Cloud storage apps

The export system enables developers to quickly reuse snippets across projects and platforms.

9. Favorites and Organization

The application provides organizational features to improve snippet management.

Users can:

Mark important snippets as favorites
Filter by language
Filter by tags
Search quickly
Sort snippets
Group related snippets

This creates a structured developer knowledge base inside the application.

Technology Stack
Technology	Purpose
Expo	Cross-platform mobile development
React Native	Mobile UI framework
TypeScript	Type-safe development
SQLite	Offline local database
Turso/libSQL	Cloud sync database
AsyncStorage	Local settings/preferences
SecureStore	Secure API key/token storage
Expo FileSystem	File handling system
AI APIs	Code explanation & semantic search
OCR Library	Code extraction from images
Application Architecture

The project follows a modular offline-first architecture:

UI Layer
   ↓
State Management Layer
   ↓
Service Layer
   ↓
SQLite Local Database
   ↓
Turso Cloud Sync

Additional systems:

AI Service Layer
OCR Processing Layer
File Management Layer

This architecture ensures:

scalability
maintainability
clean separation of concerns
production-ready structure
Suggested Screens

The application includes the following primary screens:

Home Screen

Displays all snippets with search and filtering.

Create Snippet Screen

Allows users to add new snippets.

Snippet Details Screen

Displays full snippet information and AI tools.

Favorites Screen

Shows bookmarked snippets.

AI Explanation Screen

Displays generated explanations and suggestions.

OCR Scanner Screen

Handles image selection and code extraction.

File Manager Screen

Displays local files and exports.

Sync Status Screen

Shows cloud synchronization activity.

Settings Screen

Manages themes, API keys, preferences, and storage.

Expected Learning Outcomes

This project helps developers gain practical experience in:

Offline-first mobile development
SQLite database operations
Cloud synchronization systems
AI API integration
Vector-based semantic search
OCR implementation
Local file handling
Mobile architecture design
Secure data storage
Cross-platform mobile development
Production-grade React Native practices
Final Deliverable

The final deliverable is a fully functional intelligent developer utility mobile application that enables users to:

Save and organize reusable code snippets
Work completely offline
Synchronize data with Turso cloud database
Search snippets intelligently using AI
Scan code from screenshots using OCR
Generate AI-powered explanations and improvements
Manage local development files
Export and share snippets easily
Build a personal portable developer knowledge base
One-Line Product Summary

Snipr AI is an offline-first intelligent developer companion that combines code snippet management, AI-powered assistance, semantic search, OCR code extraction, local file management, and cloud synchronization into a single modern mobile application.