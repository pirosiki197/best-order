import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from '@/components/ui/command'

interface SelectedPlaceData {
  name: string
  placeId: string
  latitude: number
  longitude: number
}

interface PlaceSearchInputProps {
  onSelect: (data: SelectedPlaceData) => void
}

function PlaceSearchInput({ onSelect }: PlaceSearchInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([])
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const isSelecting = useRef(false)

  const placesLibrary = useMapsLibrary('places')

  useEffect(() => {
    if (!placesLibrary) return
    sessionToken.current = new placesLibrary.AutocompleteSessionToken()
  }, [placesLibrary])

  useEffect(() => {
    if (!placesLibrary) {
      return
    }

    if (isSelecting.current) {
      isSelecting.current = false
      return
    }

    const fetchPredictions = async () => {
      if (!inputValue) {
        setSuggestions([])
        return
      }
      if (!sessionToken.current) return
      try {
        const { suggestions } =
          await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: inputValue,
            sessionToken: sessionToken.current,
            region: 'jp',
          })
        setSuggestions(suggestions)
      } catch (error) {
        console.error('サジェストの取得に失敗しました:', error)
      }
    }

    const timer = setTimeout(fetchPredictions, 300)
    return () => clearTimeout(timer)
  }, [inputValue, placesLibrary])

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLibrary || !suggestion.placePrediction) return

    const place = suggestion.placePrediction.toPlace()

    await place.fetchFields({
      fields: ['displayName', 'location'],
    })

    onSelect({
      name: place.displayName || '',
      placeId: place.id || '',
      latitude: place.location?.lat() || 0,
      longitude: place.location?.lng() || 0,
    })

    isSelecting.current = true
    setInputValue(suggestion.placePrediction.text.text)
    setSuggestions([])

    sessionToken.current = new placesLibrary.AutocompleteSessionToken()
  }

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="店名やキーワードを入力..."
        onValueChange={setInputValue}
        value={inputValue}
      />
      <CommandList>
        <CommandGroup>
          {suggestions
            .filter((suggestion) => !!suggestion.placePrediction)
            .map((suggestion) => (
              <CommandItem
                key={suggestion.placePrediction!.placeId}
                onSelect={() => handleSelectSuggestion(suggestion)}
                className="cursor-pointer"
              >
                {suggestion.placePrediction!.text.text}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export default PlaceSearchInput
