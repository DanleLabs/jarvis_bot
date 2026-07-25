import type { OpencodeClient } from "@opencode-ai/sdk";
import prompt from "../data/systemPrompt.txt";
import { OpenRouter } from "@openrouter/sdk";
import ocrPrompt from "../data/systemOcr.txt";
import { Bot } from "grammy";
import { Hono } from "hono";
import type { IModel } from "../types/model.type";
import { MODELS } from "../data/models.data";
import {QdrantClient} from '@qdrant/js-client-rest';
import type { PrismaClient } from "../generated/prisma/client";

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
  private bot: Bot;
  private qdrant = new QdrantClient({url: "http://127.0.0.1:6333"})
  private isBusy: boolean = false;
  private currentSessionId: string;
  private telegramBotApiKey: string;
  private telegramId: string;
  private opencodeClient: OpencodeClient;
  private openRouterClient = new OpenRouter({
    apiKey: process.env.OPEN_ROUTER_API_KEY,
  });
  private hono: Hono;
  private systemPrompt: string;
  private ocrPrompt: string;
  private albumCache = new Map<string, AlbumBucket>();
  private photoCache = new Map<string, PhotoBucket>();
  private tunnelURL: string | null = null;
  private model: IModel;
  private prisma: PrismaClient | null = null;

  public constructor(
    currentSessionId: string | null,
    telegramBotApiKey: string,
    opencodeClient: OpencodeClient,
  ) {
    this.currentSessionId = currentSessionId || "";
    this.opencodeClient = opencodeClient;
    this.telegramBotApiKey = telegramBotApiKey;
    this.systemPrompt = prompt;
    this.telegramId = process.env.USER_TELEGRAM_ID!;
    this.ocrPrompt = ocrPrompt;
    this.hono = new Hono();
    this.model = MODELS[0]!;
    this.bot = new Bot(this.getTelegramBotApiKey());
  }

  public getPrisma() {
    return this.prisma
  }

  public setPrismaClient(prisma: PrismaClient) {
    this.prisma = prisma
  }

  public getQdrant() {
    return this.qdrant
  }

  public getPhotoCache() {
    return this.photoCache;
  }

  public getIsBusy() {
    return this.isBusy;
  }

  public setIsBusy(value: boolean) {
    this.isBusy = value;
  }

  public getTelegramId() {
    return this.telegramId;
  }

  public getHono() {
    return this.hono;
  }

  public getBot() {
    return this.bot;
  }

  public getOcrPrompt() {
    return this.ocrPrompt;
  }

  public getOpenRouter() {
    return this.openRouterClient;
  }

  public getCurrentSessionId() {
    return this.currentSessionId;
  }

  public setCurrentSessionId(newId: string) {
    this.currentSessionId = newId;
  }

  public getTelegramBotApiKey() {
    return this.telegramBotApiKey;
  }

  public getOpencodeClient() {
    return this.opencodeClient;
  }

  public getSystemPrompt() {
    return this.systemPrompt;
  }

  public getAlbumCache() {
    return this.albumCache;
  }

  public setTunnelUrl(url: string) {
    this.tunnelURL = url;
  }

  public getTunnelUrl() {
    return this.tunnelURL;
  }

  public getModel() {
    return this.model;
  }

  public setModel(id: string) {
    const newModel = MODELS.find((item) => item.id === +id);
    if (!newModel) return new Error("Model was not found");
    this.model = newModel;
  }
}
