USE [master];
GO

IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'newuser')
BEGIN
    CREATE LOGIN [newuser] WITH PASSWORD = 'Password123!', CHECK_POLICY = OFF;
    ALTER SERVER ROLE [sysadmin] ADD MEMBER [newuser];
END
GO

-- Drop table
DROP TABLE IF EXISTS dbo.Answers

CREATE TABLE dbo.Answers (
	CRN bigint NOT NULL,
	[Date] nvarchar(MAX) COLLATE Latin1_General_CI_AS NULL,
	Event nvarchar(MAX) COLLATE Latin1_General_CI_AS NULL,
	Location nvarchar(MAX) COLLATE Latin1_General_CI_AS NULL,
	UpdatedBy nvarchar(MAX) COLLATE Latin1_General_CI_AS NULL,
	Updated datetime NULL,
	CONSTRAINT [PK_dbo.Answers] PRIMARY KEY (CRN)
);

INSERT INTO dbo.Answers (CRN,Date,Event,Location,UpdatedBy,Updated) VALUES
	(1102634220,N'',N'',N'',NULL,'2024-04-29'),
	(1103020285,N'Sat Oct 14 2023','JSON AI initiatives','Yvetteshire',NULL,'2024-04-29'),
	(1103119648,N'Fri May 12 2023','','',NULL,'2024-04-29'),
	(1103310984,N'Sat May 27 2023','Investor','North Kara',NULL,'2024-04-29'),
	(1104760827,N'Tue Jul 11 2023','National','Port Genevieveport',NULL,'2024-04-29'),
	(1100071369,N'Mon Nov 06 2023','Sports Centralized Incredible','Torpberg',NULL,'2024-04-29'),
	(1100434479,N'Wed Mar 06 2024','Egyptian connecting','Buckeye',NULL,'2024-04-29'),
	(1100606939,N'Wed Mar 06 2024',N'',N'',NULL,'2024-04-29'),
	(1104748754,N'Mon May 08 2023','Handmade','Laurineborough',NULL,'2024-04-29'),
	(1101594845,N'Thu Nov 16 2023','copying','East Lela',NULL,'2024-04-29'),
	(1103184806,N'Sun Oct 01 2023','Horizontal Iraqi','South Garrickhaven',NULL,'2024-04-29'),
	(1103192949,N'Sat Oct 28 2023','Delaware Rhode Borders','West Luciomouth',NULL,'2024-04-29'),
	(1103232363,N'Wed Feb 14 2024','Account Savings','East Hillardton',NULL,'2024-04-29'),
	(1103354922,N'Fri Sep 29 2023','Wisconsin','Antelope',NULL,'2024-04-29'),
	(1103388444,N'Thu Oct 26 2023','payment','South Marjoriehaven',NULL,'2024-04-29'),
	(1103727656,N'Mon Mar 18 2024','Rustic mobile','East Kameron',NULL,'2024-04-29'),
	(1103841726,N'Tue Sep 12 2023','FTP e-markets','Opalhaven',NULL,'2024-04-29'),
	(1103969349,N'Tue Apr 02 2024','California','East Aletha',NULL,'2024-04-29'),
	(1104184699,N'Tue May 16 2023','withdrawal','South Arnaldo',NULL,'2024-04-29'),
	(1104357119,N'Thu May 18 2023','open-source','South Ethylbury',NULL,'2024-04-29'),
	(1104400456,N'Fri Dec 29 2023','system-worthy','Stoltenbergmouth',NULL,'2024-04-29'),
	(1104410990,N'Sat Sep 30 2023','open-source haptic CSS','Dayton',NULL,'2024-04-29'),
	(1104537729,N'Thu Mar 14 2024','haptic Berkshire Consultant','Lake Jaylon',NULL,'2024-04-29'),
	(1104616629,N'Thu Mar 21 2024','vertical Iowa Gorgeous','Kailynshire',NULL,'2024-04-29'),
	(1104658895,N'Sun Jan 28 2024','neural','New Giovanni',NULL,'2024-04-29'),
	(1104667428,N'Sat Jul 22 2023','Ball','Jackson',NULL,'2024-04-29'),
	(1104726823,N'Mon Jun 26 2023','Principal networks Saint','Lake Felicitaview',NULL,'2024-04-29'),
	(1104745720,N'Tue Jan 30 2024','foreground Product Peso','Maricopa',NULL,'2024-04-29'),
	(1104745755,N'Thu Sep 14 2023','Kazakhstan Central bus','Lueilwitzstad',NULL,'2024-04-29'),
	(1104745789,N'Thu May 04 2023','solutions navigating Steel','Handburgh',NULL,'2024-04-29'),
	(1104745798,N'',N'',N'',NULL,'2024-04-29'),
	(1104746204,N'Sat Aug 05 2023','Open-source green overriding','Quitzonshire',NULL,'2024-04-29'),
	(1104746220,N'Wed Jul 12 2023','Interface','East Celine',NULL,'2024-04-29'),
	(1104746115,N'Wed Nov 01 2023','synthesizing','Lake Mervinbury',NULL,'2024-04-29'),
	(1104747006,N'Mon May 29 2023','Virtual','Lake Norma',NULL,'2024-04-29'),
	(1104747413,N'Thu Mar 21 2024','Pennsylvania','Kemmerfort',NULL,'2024-04-29'),
	(1104747421,N'Thu Nov 02 2023','fuchsia Administrator','Ezequielborough',NULL,'2024-04-29'),
	(1104747448,N'Mon Jul 03 2023','Distributed e-enable','Overland Park',NULL,'2024-04-29'),
	(1104747472,N'Sat May 13 2023','Investor Alaska visualize','Eunamouth',NULL,'2024-04-29'),
	(1104747286,N'Thu Jun 01 2023','Singapore','Buckeye',NULL,'2024-04-29'),
	(1104747308,N'Sat May 27 2023','Mobility','Murazikbury',NULL,'2024-04-29'),
	(1104748843,N'Wed Apr 10 2024','payment navigating XML','Durganshire',NULL,'2024-04-29'),
	(1104748746,N'Tue Mar 19 2024','withdrawal','South Juanatown',NULL,'2024-04-29'),
	(1104748770,N'Wed Sep 13 2023','Colon killer Toys','Goodwinburgh',NULL,'2024-04-29'),
	(1104748789,N'Wed Sep 13 2023','Views','Cummingsborough',NULL,'2024-04-29'),
	(1104748991,N'Tue Mar 12 2024','Internal Dynamic Rubber','Freidatown',NULL,'2024-04-29'),
	(1104757117,N'Thu Jul 27 2023','deposit','Maribelport',NULL,'2024-04-29'),
	(1104884305,N'Mon May 22 2023','Garden system edge','Jayview',NULL,'2024-04-29'),
	(1104886901,N'Wed Nov 29 2023','e-markets','East Irwinville',NULL,'2024-04-29'),
	(1106295927,N'Thu Apr 27 2023','invoice Slovakia','Oakland Park',NULL,'2024-04-29'),
	(1106309439,N'Wed Oct 04 2023','Implementation protocol bluetooth','Bellevue',NULL,'2024-04-29'),
	(1104749076,N'Mon Jul 10 2023','matrices Fresh','Santa Cruz',NULL,'2024-04-29'),
	(1104749092,N'Mon Feb 19 2024','Distributed Object-based withdrawal','Port Evansport',NULL,'2024-04-29'),
	(1104749572,N'Thu Apr 18 2024','SSL Salad Coordinator','East Dolly',NULL,'2024-04-29'),
	(1104750023,N'Wed Jan 24 2024','Buckinghamshire open-source','Independence',NULL,'2024-04-29'),
	(1104756269,N'',N'',N'',NULL,'2024-04-29'),
	(1104756285,N'Fri Dec 08 2023','deliverables Account','Jakubowskiport',NULL,'2024-04-29'),
	(1104756439,N'Wed Jan 17 2024','parsing Incredible','Keeblerport',NULL,'2024-04-29'),
	(1104756528,N'Mon Apr 15 2024','Ringgit','MacGyverfurt',NULL,'2024-04-29'),
	(1104757230,N'Thu Sep 28 2023','Fish neural schemas','Adalinefort',NULL,'2024-04-29'),
	(1104757257,N'Wed May 17 2023','Checking Home','East Joaniehaven',NULL,'2024-04-29'),
	(1104757273,N'Sat Jul 29 2023','microchip redundant models','Bradenhaven',NULL,'2024-04-29'),
	(1104757109,N'Thu Apr 11 2024','Cambridgeshire Ports Central','Quincy',NULL,'2024-04-29'),
	(1104757133,N'Fri Nov 24 2023','one-to-one','Bartonberg',NULL,'2024-04-29'),
	(1104757141,N'',N'',N'',NULL,'2024-04-29'),
	(1104759802,N'Mon Jul 24 2023','Chad Division','Port Sonya',NULL,'2024-04-29'),
	(1104913925,N'Sun Mar 24 2024','killer Belarus','Devinmouth',NULL,'2024-04-29'),
	(1104941376,N'Mon Oct 23 2023','program Garden','Azusa',NULL,'2024-04-29'),
	(1105051633,N'Wed Jun 07 2023','Multi-layered','Heaneyberg',NULL,'2024-04-29'),
	(1105062872,N'Sat Dec 09 2023','connecting Music Planner','Lake Martin',NULL,'2024-04-29'),
	(1105066010,N'Mon Sep 11 2023','Steel','Lake Deontown',NULL,'2024-04-29'),
	(1105090159,N'Fri Mar 01 2024','mindshare Virginia','Longview',NULL,'2024-04-29'),
	(1105114015,N'Mon Feb 26 2024','Sausages copy AI','Katherynmouth',NULL,'2024-04-29'),
	(1105148564,N'Tue Oct 17 2023','Table Bike','Lake Brandyn',NULL,'2024-04-29'),
	(1105191702,N'Mon Jun 12 2023','index microchip','Arliefort',NULL,'2024-04-29'),
	(1105192733,N'Thu Mar 21 2024','Developer','Schaumburg',NULL,'2024-04-29'),
	(1105203069,N'Wed Feb 28 2024','Technician Movies action-items','Bartlett',NULL,'2024-04-29'),
	(1105239713,N'',N'',N'',NULL,'2024-04-29'),
	(1105285006,N'Mon May 01 2023','Associate Quetzal B2C','Oxnard',NULL,'2024-04-29'),
	(1105550621,N'Wed Jun 07 2023','Electronics Latvia Ball','Santa Ana',NULL,'2024-04-29'),
	(1105560910,N'Wed Sep 20 2023','transmit Fork','Weimannside',NULL,'2024-04-29'),
	(1105597709,N'Wed Mar 20 2024','Global','Lake Reggie',NULL,'2024-04-29'),
	(1105730425,N'Wed May 31 2023','Caribbean Clothing','New Toniberg',NULL,'2024-04-29'),
	(1105759911,N'Tue Jan 09 2024','Customer system','Katherinebury',NULL,'2024-04-29'),
	(1105792463,N'Mon Aug 21 2023','wireless','Emardberg',NULL,'2024-04-29'),
	(1105829774,N'Mon Jul 24 2023','backing Hampshire','Raheemland',NULL,'2024-04-29'),
	(1106003969,N'Fri Apr 19 2024','Checking wireless silver','North Jadyn',NULL,'2024-04-29'),
	(1106007255,N'Thu Nov 23 2023','Factors Rubber','Lake Walterberg',NULL,'2024-04-29'),
	(1106009061,N'Mon Mar 25 2024','Ball','East Rosemarie',NULL,'2024-04-29'),
	(1106036530,N'',N'',N'',NULL,'2024-04-29'),
	(1106049837,N'Tue Jun 13 2023','up innovate','East Veronica',NULL,'2024-04-29'),
	(1106090969,N'Wed Sep 13 2023','Buckinghamshire','Jolieborough',NULL,'2024-04-29'),
	(1106093410,N'Mon Apr 22 2024','Dam','North Karinestad',NULL,'2024-04-29'),
	(1106093577,N'Sun Sep 24 2023','cross-media','Deionberg',NULL,'2024-04-29'),
	(1106262913,N'Mon Feb 05 2024','Fully-configurable Sleek e-enable','Euless',NULL,'2024-04-29'),
	(0866159801,N'Fri May 26 2023','View land','East Pafa',NULL,'2024-04-29'),
	(1106262769,N'',N'',N'',NULL,NULL);