import type {
    ActionFunction,
    LinksFunction,
    LoaderFunction,
    MetaFunction,
  } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { themeStorage } from "~/session.server";

let SESSION_TOKEN_ID = "SESSION_TOKEN_ID";

let SESSION_CONTRACT_ADDR = "SESSION_CONTRACT_ADDR";


export let action: ActionFunction = async ({ request }) => {
    const cookie = request.headers.get("Cookie");
    let session = await themeStorage.getSession(cookie);
  
    let formData = new URLSearchParams(await request.text());
    let contract = formData.get("contract");
    let tokenId = formData.get("tokenId");
  
    session.set(SESSION_TOKEN_ID, tokenId);
    session.set(SESSION_CONTRACT_ADDR, contract);

    const req = new Request(
        `https://api.nftport.xyz/v0/nfts/${contract}/${tokenId}?chain=ethereum&refresh_metadata=true`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `9495f37b-a152-415b-a32c-32660779ba1b`,
          },
          method: "GET",
        }
      );
    
      const res = await fetch(req);
      const data: any = await res.json();
      const {
        nft: { metadata },
      } = data;
  
    return json({metadata, contract, tokenId}, {
        headers: {
            "Set-Cookie": await themeStorage.commitSession(session, {
              maxAge: 60 * 60 * 24 * 7 // 7 days
            }),
        }
    });
  };
  
  export let loader: LoaderFunction = async ({ request }) => {
    const cookie = request.headers.get("Cookie");
    let session = await themeStorage.getSession(cookie);
  
    let tokenId = session.get(SESSION_TOKEN_ID);
    let contract = session.get(SESSION_CONTRACT_ADDR);

  
    if (typeof contract !== "string" && typeof tokenId !== "string") {
      const random =
        Math.random() > 0.5
          ? {
              tokenId: "9264",
              contract: "0x0AE53C425F0725123205fd4CBDFB1Ac8240445cF",
            }
          : {
              tokenId: "2558",
              contract: "0x0AE53C425F0725123205fd4CBDFB1Ac8240445cF",
            };
  
      tokenId = random.tokenId;
      contract = random.contract;
    }
  
    session.set(SESSION_TOKEN_ID, tokenId);
    session.set(SESSION_CONTRACT_ADDR, contract);
  
    const req = new Request(
      `https://api.nftport.xyz/v0/nfts/${contract}/${tokenId}?chain=ethereum&refresh_metadata=true`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.NFT_PORT_TOKEN ?? '',
        },
        method: "GET",
      }
    );
  
    const res = await fetch(req);
    const data: any = await res.json();
    const {
      nft: { metadata },
    } = data;

    
  
    return json(
      { metadata, contract, tokenId },
      {
        headers: {
            "Set-Cookie": await themeStorage.commitSession(session, {
              maxAge: 60 * 60 * 24 * 7 // 7 days
            }),
        }
      }
    );
  };
  