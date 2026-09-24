import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { BlocksFeature, FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Issues } from './collections/Issues'
import { AfricanSun } from './collections/AfricanSun'
import { Sections } from './collections/Sections'
import { Pieces } from './collections/Pieces'
import { ArtworkBlock } from './blocks/ArtworkBlock'
import { PullQuoteBlock } from './blocks/PullQuoteBlock'
import { VisualTypographyBlock } from './blocks/VisualTypographyBlock'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Define your URLs dynamically
const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5000'

const parseOrigins = (value?: string): string[] => {
  if (!value) return []

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const allowedOrigins = Array.from(
  new Set([
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.CORS_ORIGINS),
    frontendURL,
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ]),
)

const csrfOrigins = Array.from(new Set([...allowedOrigins, serverURL]))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Use the dynamic variable here
  serverURL: serverURL,

  // Update CORS and CSRF to trust both your local and production URLs
  cors: allowedOrigins,

  csrf: csrfOrigins,
  collections: [Users, Media, Issues, Sections, Pieces, AfricanSun],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      BlocksFeature({
        blocks: [ArtworkBlock, PullQuoteBlock, VisualTypographyBlock],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      clientUploads: true,
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.S3_ENDPOINT || '',
      },
    }),
  ],
})