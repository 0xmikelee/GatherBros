'use client'
import 'mapbox-gl/dist/mapbox-gl.css'
import { wmntContractAbi } from '@/contract/wmnt-contract-abi'
import LocationContract from '@/contract/location-contract'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import ReactMapGL, { Marker } from 'react-map-gl'
import { getContract, parseEther } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import wMNTContract from '@/contract/wmnt-contract'
import { useContractStore } from '@/contract/state'

export default function Location() {
  const [userLocation, setUserLocation] = useState<null | {
    latitude: number
    longitude: number
  }>(null)
  const [viewport, setViewport] = useState<{
    latitude: number
    longitude: number
    zoom: number
  }>({
    latitude: 40.73061,
    longitude: -73.935242,
    zoom: 10,
  })
  const [error, setError] = useState<null | string>(null)
  const publicClient = usePublicClient()
  const { data: walletClient, isError, isLoading } = useWalletClient()
  const { data: session, status } = useSession()
  const { contracts, createWMNTContract, createLocationContract } =
    useContractStore()

  useEffect(() => {
    const fetchLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setUserLocation({ latitude, longitude })
            setViewport((vp) => ({
              ...vp,
              latitude,
              longitude,
              zoom: 14,
            }))
          },
          (error) => {
            setError(error.message)
          },
        )
      } else {
        setError('Geolocation is not supported by this browser.')
      }
    }
    fetchLocation()
  }, [])

  // if (status === 'unauthenticated') {
  //   return redirect('/')
  // }
  //
  if (!walletClient) {
    return null
  }

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ latitude, longitude })
          setViewport((vp) => ({
            ...vp,
            latitude,
            longitude,
            zoom: 14,
          }))
        },
        (error) => {
          setError(error.message)
        },
      )
    } else {
      setError('Geolocation is not supported by this browser.')
    }
  }

  createWMNTContract(walletClient)
  if (contracts.wmnt) {
    createLocationContract(walletClient, contracts.wmnt)
  }
  if (!contracts.location || !contracts.wmnt) {
    return null
  }

  const getBalance = async () => {
    await contracts.wmnt!.approve(contracts.location!.address, 1)

    const balance = await contracts.wmnt!.contract.read.balanceOf([
      walletClient.account.address,
    ])
  }

  const submitLocation = async () => {
    await contracts.location!.swapForGBL(1)

    // const res = await fetch('/api/location', {
    //   method: 'PATCH',
    //   body: JSON.stringify({
    //     id: '652a4e4e64b809c31e44d371',
    //     latitude: userLocation?.latitude ?? 0,
    //     longitude: userLocation?.longitude ?? 0,
    //     amount: 1,
    //   }),
    // body: JSON.stringify({
    //   username: 'cloudre01',
    //   name: 'Alex',
    //   image_url: 'www.myimage.com',
    //   wallet_address: '0x0',
    // }),
    // })
    // console.log(await res.json())
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <button
        onClick={refreshLocation}
        className="p-2 bg-blue-600 text-white rounded"
      >
        Get Location
      </button>

      <div className="m-2 rounded">
        <ReactMapGL
          {...viewport}
          mapStyle="mapbox://styles/mapbox/streets-v9"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          onMove={(evt) => setViewport(evt.viewState)}
          style={{ width: 400, height: 400 }}
        >
          <Marker
            latitude={userLocation?.latitude ?? 0}
            longitude={userLocation?.longitude ?? 0}
            anchor="bottom"
            color="red"
          >
            <svg height="30" width="30" viewBox="0 0 24 24">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="#D00"
              />
            </svg>
          </Marker>
        </ReactMapGL>
      </div>

      <button
        className="p-2 bg-red-600 text-white rounded"
        onClick={submitLocation}
      >
        Make It Rain
      </button>
      <button
        className="p-2 bg-red-600 text-white rounded"
        onClick={getBalance}
      >
        Balance
      </button>
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
    </div>
  )
}
