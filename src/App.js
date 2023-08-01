import React, { useState, useEffect } from 'react';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  Card,
  useTheme,
  withAuthenticator,
} from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from './graphql/mutations';

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const { tokens } = useTheme();

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get('image');
    const data = {
      name: form.get('name'),
      description: form.get('description'),
      image: image.name,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Note Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: 'end' }}
          />
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Notes</Heading>
      <Flex direction="column" alignItems="center">
        <View margin="3rem 3rem" width="50%">
          {notes.map((note) => (
            <View
              key={note.id || note.name}
              backgroundColor={tokens.colors.background.secondary}
              padding={tokens.space.medium}
            >
              <Card>
                <Flex direction="row" alignItems="flex-start">
                  {note.image && (
                    <Image
                      src={note.image}
                      alt={`visual aid for ${notes.name}`}
                      width="70%"
                      maxWidth="25rem"
                    />
                  )}
                  <Flex
                    direction="column"
                    alignItems="flex-start"
                    gap={tokens.space.xs}
                  >
                    <Heading level={5} margin="0 0.5rem">
                      {note.name}
                    </Heading>
                    <Text as="span" margin="1rem 0">
                      {note.description}
                    </Text>
                    <Button
                      variation="primary"
                      onClick={() => deleteNote(note)}
                    >
                      Delete note
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </View>
          ))}
        </View>
      </Flex>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);
