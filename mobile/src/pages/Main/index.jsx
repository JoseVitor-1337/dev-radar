import React, {  useState, useEffect } from 'react'
import { StyleSheet, Image, View, Text, TextInput, TouchableOpacity } from 'react-native'
import { requestBackgroundPermissionsAsync, getCurrentPositionAsync } from 'expo-location'
import MapView, { Marker, Callout } from 'react-native-maps'
import { MaterialIcons } from '@expo/vector-icons'

import api from "../../services/api"
import { subscribeToNewDevs, connect, disconnect } from "../../services/socket"

function Home({ navigation }) {
  const [devs, setDevs] = useState([])
  const [techs, setTechs] = useState("")
  const [currentRegion, setCurrentRegion] = useState(null)

  
  async function loadDevs() {
    const { latitude, longitude } = currentRegion;
    
    try {
      const response = await api.get("/search", { 
        params: {
          latitude,
          longitude,
          techs
        }
      })

      setDevs(response.data)
    } catch (error) {
      console.log(`error`, error)
    }
  } 

  async function connectWebsocket() {
    disconnect()

    const { latitude, longitude } = currentRegion

    connect({
      latitude,
      longitude
    })
  }

  async function handleRegionChange(region) {
    setCurrentRegion(region)
  } 

  useEffect(() => {
    async function loadInitialPosition() {
      let { granted } = await requestBackgroundPermissionsAsync()

      if (granted) {
       const { coords } = await getCurrentPositionAsync({})
       
        const { latitude, longitude } = coords

        setCurrentRegion({
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04
        })
      }
    }

    loadInitialPosition()
  }, [])

  useEffect(() => {
    subscribeToNewDevs(dev => setDevs([...devs, dev]))
  }, [devs])

  useEffect(() => {
    async function loadInitialDevs() {
      console.log(`loadInitialDevs`)

      connectWebsocket()

      try {
        const response = await api.get("/devs")
  
        setDevs(response.data)
      } catch (error) {
        console.log(`error`, error)
      }
    }

    loadInitialDevs()
  
  }, [])


  if (!currentRegion) return null

  return (
   <>
     <MapView onRegionChangeComplete={handleRegionChange} initialRegion={currentRegion} style={styles.map}>
     {devs.map((dev) => (
        <Marker key={dev.github_username} coordinate={{ latitude: dev.location.coordinates[1], longitude:dev.location.coordinates[0], }}>
        <Image style={styles.avatar} source={{ uri: dev.avatar_url }} />

        <Callout onPress={() => navigation.navigate('Profile', { github_username: dev.github_username})}>
          <View style={styles.callout}>
            <Text style={styles.devName}>{dev.name}</Text>
            <Text style={styles.devBio}>{dev.bio}</Text>
            <Text style={styles.devTechs}>{dev.techs.join(", ")}</Text>
          </View>
        </Callout>
      </Marker>
     ))}
    </MapView>

    <View style={styles.searchForm}>
      <TextInput  
        style={styles.searchInput} 
        placeholder="Buscar devs por tecnologias..."
        placeholderTextColor="#999"
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={setTechs}
      />

        <TouchableOpacity onPress={() => {
          console.log("Press")
          loadDevs()
        }} style={styles.loadButton}>
          <MaterialIcons name="my-location" size={20} color="#FFF" />
        </TouchableOpacity>
    </View>
   </>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 4,
    borderWidth: 4,
    borderColor: "#FFF"
  },
  callout: {
    width: 260,
  },
  devName: {
    fontWeight: "bold",
    fontSize: 16
  },
  devBio: {
    color: "#666",
    marginTop: 5
  },
  devTechs: {
    marginTop: 5
  },
  searchForm: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 5,
    flexDirection: "row"
  },

  searchInput: {
    height: 50,
    flex: 1,
    backgroundColor: "#FFF",
    color: "#333",
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 4,
      height: 4
    },
    elevation: 2
  },

  loadButton: {
    height: 50,
    width: 50,
    backgroundColor: "#8e4dff",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15
  }
})

export default Home