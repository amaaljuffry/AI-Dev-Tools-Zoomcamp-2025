import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, Users, Play, Share2 } from 'lucide-react'
import { 
  Button, 
  TextField, 
  Card, 
  Flex, 
  Text, 
  Heading, 
  Box, 
  Separator,
  Container,
  Grid
} from '@radix-ui/themes'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState('')
  const navigate = useNavigate()

  const createRoom = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'javascript' }),
      })
      const data = await res.json()
      navigate(`/room/${data.roomId}`)
    } catch (err) {
      console.error('Failed to create room:', err)
      alert('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = () => {
    if (joinRoomId.trim()) {
      navigate(`/room/${joinRoomId.trim()}`)
    }
  }

  return (
    <Box className="min-h-screen bg-black" style={{ background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box className="border-b border-zinc-800">
        <Container size="3" px="5" py="4">
          <Flex align="center" gap="2">
            <Code2 className="w-6 h-6" />
            <Text size="5" weight="bold">CodeInterview</Text>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="2" px="5" style={{ paddingTop: '80px', paddingBottom: '80px', flex: 1 }}>
        <Flex direction="column" align="center">
          <Box className="text-center" mb="8">
            <Heading size="8" weight="bold" mb="4">
              Real-time Collaborative
              <br />
              Code Interview Platform
            </Heading>
            <Text as="p" size="4" color="gray">
              Create a room, share the link, and code together in real-time.
              <br />
              Execute JavaScript and Python directly in the browser.
            </Text>
          </Box>

          {/* Features */}
          <Grid columns="3" gap="4" width="100%" mb="8">
            <Card style={{ background: '#0a0a0a', border: '1px solid #27272a' }}>
              <Flex direction="column" p="2">
                <Users className="w-8 h-8 mb-3 text-zinc-400" />
                <Text size="3" weight="medium" mb="1">Collaborate</Text>
                <Text size="2" color="gray">
                  Real-time editing with live cursors
                </Text>
              </Flex>
            </Card>
            <Card style={{ background: '#0a0a0a', border: '1px solid #27272a' }}>
              <Flex direction="column" p="2">
                <Play className="w-8 h-8 mb-3 text-zinc-400" />
                <Text size="3" weight="medium" mb="1">Execute</Text>
                <Text size="2" color="gray">
                  Run JS & Python in the browser
                </Text>
              </Flex>
            </Card>
            <Card style={{ background: '#0a0a0a', border: '1px solid #27272a' }}>
              <Flex direction="column" p="2">
                <Share2 className="w-8 h-8 mb-3 text-zinc-400" />
                <Text size="3" weight="medium" mb="1">Share</Text>
                <Text size="2" color="gray">
                  One-click shareable room links
                </Text>
              </Flex>
            </Card>
          </Grid>

          {/* Actions */}
          <Card style={{ background: '#0a0a0a', border: '1px solid #27272a', width: '100%' }}>
            <Flex direction="column" gap="4" p="4">
              <Button 
                size="3" 
                onClick={createRoom}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  cursor: 'pointer',
                  background: '#fff',
                  color: '#000'
                }}
              >
                {loading ? 'Creating...' : 'Create New Room'}
              </Button>

              <Flex align="center" gap="3">
                <Separator size="4" style={{ flex: 1 }} />
                <Text size="2" color="gray">or join existing</Text>
                <Separator size="4" style={{ flex: 1 }} />
              </Flex>

              <Flex gap="3">
                <Box style={{ flex: 1 }}>
                  <TextField.Root
                    size="3"
                    placeholder="Enter room ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                    style={{ width: '100%' }}
                  />
                </Box>
                <Button 
                  size="3" 
                  variant="outline"
                  onClick={joinRoom}
                  style={{ cursor: 'pointer' }}
                >
                  Join
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Container>

      {/* Footer */}
      <Box className="border-t border-zinc-800">
        <Container size="3" px="5" py="4">
          <Text size="2" color="gray" align="center" as="p">
            Built with React, Monaco Editor, Yjs & Pyodide by AMA
          </Text>
        </Container>
      </Box>
    </Box>
  )
}
