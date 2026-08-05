import type { OpencodeClient } from "@opencode-ai/sdk";
import prompt from "../data/systemPrompt.txt";
import { OpenRouter } from "@openrouter/sdk";
import ocrPrompt from "../data/systemOcr.txt";
import { Bot, Context } from "grammy";
import { Hono } from "hono";
import {QdrantClient} from '@qdrant/js-client-rest';
import type { PrismaClient } from "../generated/prisma/client";
import type { ConversationFlavor } from "@grammyjs/conversations";

interface AlbumBucket {
  timer: Timer;
  caption: string | null;
  files: Array<{ id: string; name: string }>;
}

interface PhotoBucket {
  timer: Timer;
  caption: string | null;
  fileIds: string[];
}

export class State {
  private bot: Bot<ConversationFlavor<Context>>;
  private qdrant = new QdrantClient({url: "http://127.0.0.1:6333"})
  private telegramBotApiKey: string = process.env.TELEGRAM_BOT_API_KEY!;
  private allowedTgId: string = process.env.USER_TELEGRAM_ID!
  private opencodeClient: OpencodeClient;
  private openRouterClient = new OpenRouter({
    apiKey: process.env.OPEN_ROUTER_API_KEY,
  });
  private hono: Hono;
  private albumCache = new Map<string, AlbumBucket>();
  private photoCache = new Map<string, PhotoBucket>();
  private prisma: PrismaClient
  private defaultSystemPrompt: string = prompt
  private defaultOcrPrompt: string = ocrPrompt

  public constructor(
    data: {bot: Bot<ConversationFlavor<Context>>, hono: Hono, openRouter: OpenRouter, opencode: OpencodeClient, prisma: PrismaClient}
  ) {
    this.opencodeClient = data.opencode;
    this.hono = data.hono;
    this.bot = data.bot;
    this.openRouterClient = data.openRouter
    this.prisma = data.prisma
  }

  public getDefaultSystemPrompt() {
    return this.defaultSystemPrompt
  }
  public getDefaultOcrPrompt() {
    return this.defaultOcrPrompt
  }

  public getPrisma() {
    return this.prisma
  }

  public getQdrant() {
    return this.qdrant
  }

  public getPhotoCache() {
    return this.photoCache;
  }

  public getTelegramId() {
    return this.allowedTgId;
  }

  public getHono() {
    return this.hono;
  }

  public getBot() {
    return this.bot;
  }

  public getOpenRouter() {
    return this.openRouterClient;
  }

  public getTelegramBotApiKey() {
    return this.telegramBotApiKey;
  }

  public getOpencodeClient() {
    return this.opencodeClient;
  }

  public getAlbumCache() {
    return this.albumCache;
  }
}
