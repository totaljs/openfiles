CREATE TABLE "public"."tbl_file" (
	"id" text NOT NULL,
	"db" text,
	"name" text,
	"checksum" text,
	"url" text,
	"ext" text,
	"type" text,
	"hostname" text,
	"createdby" text,
	"size" int4 DEFAULT 0,
	"width" int2 DEFAULT 0,
	"height" int2 DEFAULT 0,
	"date" timestamp DEFAULT timezone('utc'::text, now()),
	"dtcreated" timestamp DEFAULT timezone('utc'::text, now()),
	PRIMARY KEY ("id")
);